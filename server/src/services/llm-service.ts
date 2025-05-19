import type { Core } from '@strapi/strapi';
import { OpenAI } from 'openai';

import {
  LLMServiceType,
  PluginConfig,
  TranslatableField,
  TranslationConfig,
  TranslationResponse,
  UIDField,
} from '../../src/types';
import {
  DEFAULT_SYSTEM_PROMPT,
  SYSTEM_PROMPT_APPENDIX,
  SYSTEM_PROMPT_FIX,
  USER_PROMPT_FIX_PREFIX,
} from '../config/constants';
import { cleanJSONString, balanceJSONBraces, safeJSONParse } from '../utils/json-utils';

const openai = new OpenAI({
  baseURL: process.env.STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL,
  apiKey: process.env.LLM_TRANSLATOR_LLM_API_KEY,
});

const model = process.env.STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL;



const extractTranslatableFields = (
  contentType: Record<string, any>,
  fields: Record<string, any>,
  components: Record<string, any> = {}
): TranslatableField[] => {
  const translatableFields: TranslatableField[] = [];

  const isTranslatableFieldSchema = (
    schema: Record<string, any> | undefined,
    value: any
  ): boolean => {
    if (!schema || typeof value !== 'string') {
      return false;
    }

    const isStringOrText = ['string', 'text', 'richtext'].includes(schema.type);
    const isNotUID = schema.type !== 'uid';
    const isLocalizable = schema.pluginOptions?.i18n?.localized !== false;

    return isStringOrText && isNotUID && isLocalizable;
  };

  const traverse = (
    schema: Record<string, any>,
    data: Record<string, any>,
    path: string[] = [],
    originalPath: string[] = []
  ) => {
    Object.entries(schema.attributes || {}).forEach(([fieldName, fieldSchemaRaw]) => {
      const fieldSchema = fieldSchemaRaw as Record<string, any>;
      const value = data?.[fieldName];
      if (value === undefined || value === null) {
        return;
      }

      if (isTranslatableFieldSchema(fieldSchema, value)) {
        translatableFields.push({
          path: [...path, fieldName],
          value,
          originalPath: [...originalPath, fieldName],
        });
        return;
      }

      if (fieldSchema.type === 'component') {
        const componentSchema = components[fieldSchema.component];
        if (!componentSchema) return;

        if (fieldSchema.repeatable && Array.isArray(value)) {
          value.forEach((item: any, index: number) =>
            traverse(componentSchema, item, [...path, fieldName, String(index)], [...originalPath, fieldName, String(index)])
          );
        } else if (typeof value === 'object') {
          traverse(componentSchema, value, [...path, fieldName], [...originalPath, fieldName]);
        }
      } else if (fieldSchema.type === 'dynamiczone' && Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          const compSchema = components[item.__component];
          if (compSchema) {
            traverse(compSchema, item, [...path, fieldName, String(index)], [...originalPath, fieldName, String(index)]);
          }
        });
      }
    });
  };

  traverse(contentType, fields, [], []);

  return translatableFields;
};

const prepareTranslationPayload = (fields: TranslatableField[]): Record<string, any> => {
  const payload: Record<string, any> = {};

  fields.forEach((field) => {
    let current = payload;
    field.path.forEach((part, index) => {
      if (index === field.path.length - 1) {
        current[part] = field.value;
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  });

  return payload;
};

const mergeTranslatedContent = (
  originalData: Record<string, any>,
  translatedData: Record<string, any>,
  translatableFields: TranslatableField[]
): Record<string, any> => {
  const result = JSON.parse(JSON.stringify(originalData));

  translatableFields.forEach((field) => {
    let translatedValue = translatedData;
    for (const part of field.path) {
      translatedValue = translatedValue?.[part];
      if (translatedValue === undefined) break;
    }

    if (translatedValue !== undefined) {
      let current = result;
      field.originalPath.forEach((part, index) => {
        if (index === field.originalPath.length - 1) {
          current[part] = translatedValue;
        } else {
          current = current[part];
        }
      });
    }
  });

  return result;
};

const generateSlug = async (
  data: Record<string, any>,
  field: string,
  contentTypeUID: string
): Promise<string> => {
  // Get the UID service
  const uidService = strapi.service('plugin::content-manager.uid');

  // Generate a unique UID based on the title field
  const slug = await uidService.generateUIDField({
    contentTypeUID,
    field,
    data,
  });

  return slug;
};

const findUIDFields = (contentType: Record<string, any>): UIDField[] => {
  const uidFields: UIDField[] = [];

  Object.entries(contentType.attributes || {}).forEach(([fieldName, schema]: [string, any]) => {
    if (schema.type === 'uid' && schema.targetField) {
      uidFields.push({
        fieldName,
        targetField: schema.targetField,
      });
    }
  });

  return uidFields;
};

const generateUIDsForTranslatedFields = async (
  uidFields: UIDField[],
  translatedData: Record<string, any>,
  contentTypeUID: string,
  mergedContent: Record<string, any>
): Promise<Record<string, any>> => {
  const translatedUIDs: Record<string, any> = {};

  for (const { fieldName, targetField } of uidFields) {
    // Only generate new UID if the target field was translated
    if (translatedData[targetField] !== undefined) {
      try {
        const newUID = await generateSlug(
          {
            ...mergedContent,
            [targetField]: translatedData[targetField],
          },
          fieldName,
          contentTypeUID
        );
        translatedUIDs[fieldName] = newUID;
      } catch (error) {
        console.error(`Failed to generate UID for field ${fieldName}:`, error);
      }
    }
  }

  return translatedUIDs;
};

const llmService = ({ strapi }: { strapi: Core.Strapi }): LLMServiceType => ({
  async generateWithLLM(
    contentType: Record<string, any>,
    fields: Record<string, any>,
    components: Record<string, any>,
    config: TranslationConfig
  ): Promise<TranslationResponse> {
    try {
      const userConfig = await getUserConfig();

      const translatableFields = extractTranslatableFields(contentType, fields, components);
      const translationPayload = prepareTranslationPayload(translatableFields);
      const prompt = buildPrompt(translationPayload, config.targetLanguage);
      const systemPrompt = await buildSystemPrompt(userConfig);
      const response = await callLLMProvider(prompt, systemPrompt, model, userConfig);
      const translatedData = await parseLLMResponse(response);

      // Get base merged content
      const mergedContent = mergeTranslatedContent(fields, translatedData, translatableFields);

      // Handle UID fields as they might have a relation base to another translated field
      const uidFields = findUIDFields(contentType);
      const translatedUIDs = await generateUIDsForTranslatedFields(
        uidFields,
        translatedData,
        contentType.uid,
        mergedContent
      );

      return {
        data: {
          ...mergedContent,
          ...translatedUIDs,
        },
        meta: {
          ok: true,
          status: 200,
          message: 'Translation completed successfully',
        },
      };
    } catch (error) {
      strapi.log.error('LLM translation error:', error);
      return {
        data: fields, // Return original fields in case of error
        meta: {
          ok: false,
          status: 500,
          message: error instanceof Error ? error.message : 'Translation failed',
        },
      };
    }
  },
});

const buildPrompt = (fields: Record<string, any>, targetLanguage: string): string => {
  return `You are translating content from a CMS. Please translate the following JSON data to ${targetLanguage}.

IMPORTANT RULES:
1. Preserve all JSON structure and keys exactly as provided
2. Only translate string values
3. Maintain any markdown formatting within the text
4. Keep HTML tags intact if present
5. Preserve any special characters or placeholders
6. Return ONLY the translated JSON object
7. Ensure the JSON is valid and well-formed, all values must be strings
8. Do not add any explanations or comments
9. Ensure professional and culturally appropriate translations

SOURCE JSON:
${JSON.stringify(fields, null, 2)}`;
};

const getUserConfig = async (): Promise<PluginConfig> => {
  // Get configuration from plugin store
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'strapi-llm-translator',
  });

  const config = (await pluginStore.get({ key: 'configuration' })) as PluginConfig;

  return config;
};

const buildSystemPrompt = async (config: PluginConfig): Promise<string> => {
  return `${config.systemPrompt || DEFAULT_SYSTEM_PROMPT} ${SYSTEM_PROMPT_APPENDIX}`;
};

const createLLMRequest = (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature = 0.1
) => {
  return openai.chat.completions.create({
    model,
    messages,
    temperature,
  });
};

const callLLMProvider = async (
  prompt: string,
  systemPrompt: string,
  model: string,
  config: PluginConfig
): Promise<any> => {
  return createLLMRequest(
    [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    config.temperature
  );
};

const requestJSONCorrection = async (invalidJson: string): Promise<Record<string, any>> => {
  const response = await createLLMRequest([
    {
      role: 'system',
      content: SYSTEM_PROMPT_FIX,
    },
    {
      role: 'user',
      content: `${USER_PROMPT_FIX_PREFIX} ${invalidJson}`,
    },
  ]);

  const correctedContent = response.choices[0]?.message?.content;
  if (!correctedContent) throw new Error('No content in correction response');

  return safeJSONParse(correctedContent.trim());
};

const parseLLMResponse = async (response: any): Promise<Record<string, any>> => {
  try {
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in response');

    const cleanContent = cleanJSONString(content);

    try {
      return safeJSONParse(cleanContent);
    } catch (parseError) {
      const balancedContent = balanceJSONBraces(cleanContent);

      try {
        return safeJSONParse(balancedContent);
      } catch (secondError) {
        console.error('Second parse attempt failed:', secondError);
        return await requestJSONCorrection(cleanContent);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Translation failed: ${errorMessage}`);
  }
};

export default llmService;
