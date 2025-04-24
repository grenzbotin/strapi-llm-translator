import type { Core, Plugin } from '@strapi/strapi';
import { OpenAI } from 'openai';

import {
  LLMServiceType,
  PluginConfig,
  TranslatableField,
  TranslationConfig,
  TranslationResponse,
  UIDField,
} from '../../src/types';
import { DEFAULT_SYSTEM_PROMPT, SYSTEM_PROMPT_APPENDIX } from '../config/constants';

const openai = new OpenAI({
  baseURL: process.env.STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL,
  apiKey: process.env.LLM_TRANSLATOR_LLM_API_KEY,
});

const model = process.env.STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL;

const isTranslatableField = (
  contentType: Record<string, any>,
  key: string,
  value: any
): boolean => {
  // Skip if not a string value
  if (typeof value !== 'string') {
    return false;
  }

  // Get field schema from content type
  const fieldSchema = contentType?.attributes?.[key];
  if (!fieldSchema) {
    return false;
  }

  // Check if field is of type string or text
  const isStringOrText = ['string', 'text'].includes(fieldSchema.type);

  // Exclude uid fields and non-localizable fields
  const isNotUID = fieldSchema.type !== 'uid';
  const isLocalizable = fieldSchema.pluginOptions?.i18n?.localized !== false;

  return isStringOrText && isNotUID && isLocalizable;
};

const extractTranslatableFields = (
  contentType: Record<string, any>,
  fields: Record<string, any>,
  components: Record<string, any> = {}
): TranslatableField[] => {
  const translatableFields: TranslatableField[] = [];

  // Handle top-level fields
  Object.entries(fields).forEach(([key, value]) => {
    if (isTranslatableField(contentType, key, value)) {
      translatableFields.push({
        path: [key],
        value: value as string,
        originalPath: [key],
      });
    }
  });

  // Handle blocks with dynamic component checking
  if (fields.blocks && Array.isArray(fields.blocks)) {
    fields.blocks.forEach((block: any, blockIndex: number) => {
      if (block.__component && components[block.__component]) {
        const componentSchema = components[block.__component];

        // Check each attribute in the component
        Object.entries(componentSchema.attributes).forEach(([fieldName, schema]: [string, any]) => {
          // Check if the field exists in the block and is of type string/text/richtext
          if (
            block[fieldName] &&
            typeof block[fieldName] === 'string' &&
            ['string', 'text', 'richtext'].includes(schema.type)
          ) {
            translatableFields.push({
              path: ['blocks', String(blockIndex), fieldName],
              value: block[fieldName],
              originalPath: ['blocks', String(blockIndex), fieldName],
            });
          }
        });
      }
    });
  }

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
      const translatedData = parseLLMResponse(response);

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
7. Do not add any explanations or comments
8. Ensure professional and culturally appropriate translations

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

const callLLMProvider = async (
  prompt: string,
  systemPrompt: string,
  model: string,
  config: PluginConfig
): Promise<any> => {
  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: config.temperature,
  });

  return response;
};

const parseLLMResponse = (response: any): Record<string, any> => {
  try {
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in response');

    // Remove markdown code block formatting if present
    const cleanContent = content
      .replace(/^```json\s*\n/, '') // Remove opening ```json with any whitespace
      .replace(/^```\s*\n/, '') // Remove opening ``` without json
      .replace(/\n\s*```$/, '') // Remove closing ``` with any whitespace
      .replace(/\u200B/g, '') // Remove zero-width spaces
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
      .trim(); // Trim any leading/trailing whitespace

    // First attempt to parse
    try {
      const parsed = JSON.parse(cleanContent);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
      throw new Error('Invalid response format - not an object');
    } catch (parseError) {
      // Count opening and closing braces as often the LLM returns an unbalanced JSON
      const openBraces = (cleanContent.match(/{/g) || []).length;
      const closeBraces = (cleanContent.match(/}/g) || []).length;

      if (openBraces > closeBraces) {
        // Add missing closing braces
        const missingBraces = openBraces - closeBraces;
        const fixedContent = cleanContent + '}'.repeat(missingBraces);

        try {
          const parsed = JSON.parse(fixedContent);
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed;
          }
        } catch (secondError) {
          console.error('Second parse attempt failed:', secondError);
        }
      }

      // If we get here, throw a detailed error
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Translation failed: ${errorMessage}`);
  }
};

export default llmService;
