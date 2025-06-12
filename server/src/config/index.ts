import { DEFAULT_LLM_BASE_URL, DEFAULT_LLM_MODEL } from './constants';

export default {
  default: ({ env }) => ({
    llmApiKey: env('LLM_TRANSLATOR_LLM_API_KEY'),
    llmEndpoint: env('STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL'),
    llmModel: env('STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL'),
  }),
  validator(config) {
    const PLUGIN_NAME = 'Strapi LLM Translator';
    console.info(`\n==== ${PLUGIN_NAME} Configuration Validation ====`);

    // Validate API Key
    if (!config?.llmApiKey) {
      console.warn('⚠️  LLM API Key: Missing');
      console.info('   → Translation features requiring API keys will be disabled');
    } else {
      console.info('✅ LLM API Key: Configured');
    }

    // Validate API Endpoint
    const endpoint = config?.llmEndpoint || DEFAULT_LLM_BASE_URL;
    if (!config?.llmEndpoint) {
      console.warn(`⚠️  API Endpoint: Using default (${DEFAULT_LLM_BASE_URL})`);
    } else {
      console.info(`✅ API Endpoint: Configured (${endpoint})`);
    }

    // Validate LLM Model
    const model = config?.llmModel || DEFAULT_LLM_MODEL;
    if (!config?.llmModel) {
      console.warn(`⚠️  LLM Model: Using default (${DEFAULT_LLM_MODEL})`);
    } else {
      console.info(`✅ LLM Model: Configured (${model})`);
    }

    console.info('========================================================\n');
  },
};
