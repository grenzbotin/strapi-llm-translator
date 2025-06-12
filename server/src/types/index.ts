import type { Core } from '@strapi/strapi';

export * from './controllers';

export type CoreStrapi = Omit<Core.Strapi, 'query' | 'plugin'> & {
  plugin: (pluginName: string) => Omit<Core.Plugin, 'contentTypes'> & {
    contentTypes: Record<
      string,
      Core.Plugin['contentTypes'][string] & {
        uid: string;
      }
    >;
  };
};

export type StrapiContext = {
  readonly strapi: CoreStrapi;
};

export interface TranslationResponse {
  data: Record<string, any>;
  meta: {
    ok: boolean;
    status: number;
    message?: string;
  };
}

export interface TranslationConfig {
  targetLanguage: string;
}

export interface LLMServiceType {
  generateWithLLM(
    contentType: Record<string, any>,
    fields: Record<string, any>,
    components: Record<string, any>,
    config: TranslationConfig
  ): Promise<Record<string, any>>;
}

export interface GenerateRequestBody {
  contentType: string;
  fields: any;
  components: any;
  targetLanguage: string;
}

export interface TranslatableField {
  path: string[];
  value: any;
  originalPath: string[];
}

export interface UIDField {
  fieldName: string;
  targetField: string;
}

export interface LLMConfigType {
  llmEndpoint: string;
  llmApiKey: string;
  llmModel: string;
}
