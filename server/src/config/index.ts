export default {
  default: {
    llmApiKey: process.env.LLM_TRANSLATOR_LLM_API_KEY,
    llmEndpoint:
      process.env.STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL ||
      'https://api.openai.com/v1/chat/completions',
    llmModel: process.env.STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL || 'gpt-4o',
  },
  validator() {
    const {
      LLM_TRANSLATOR_LLM_API_KEY,
      STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL,
      STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL,
    } = process.env;

    if (!LLM_TRANSLATOR_LLM_API_KEY) {
      throw new Error('LLM_TRANSLATOR_LLM_API_KEY is required');
    }

    if (!STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL) {
      console.info(
        'STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL is not set, using default: https://api.openai.com/v1/chat/completions'
      );
    } else {
      console.info(
        `STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL is set to: ${STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL}`
      );
    }

    if (!STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL) {
      console.info('STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL is not set, using default: gpt-4o');
    } else {
      console.info(
        `STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL is set to: ${STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL}`
      );
    }
  },
};
