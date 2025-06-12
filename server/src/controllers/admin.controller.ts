import { GenerateRequestBody, PluginUserConfig, RequestContext, StrapiContext } from 'src/types';

const controllers = ({ strapi }: StrapiContext) => ({
  // Genertate translations
  async generate(ctx: RequestContext & { request: { body: GenerateRequestBody } }) {
    try {
      const { fields, components, targetLanguage, contentType } = ctx.request.body;
      const result = await strapi
        .plugin('strapi-llm-translator')
        .service('llm-service')
        .generateWithLLM(contentType, fields, components, {
          targetLanguage,
        });

      ctx.status = result.meta.status;
      ctx.body = result;
    } catch (error) {
      console.error('Error in generate controller:', error);
      ctx.status = 500;
      ctx.body = {
        meta: {
          ok: false,
          status: 500,
          message: 'Internal server error',
        },
      };
    }
  },

  // Get the configuration
  async getConfig(ctx: RequestContext) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-llm-translator', // replace with your plugin name
    });

    const config = await pluginStore.get({ key: 'configuration' });
    ctx.body = (config as PluginUserConfig) || {}; // Return empty object if no config exists yet
  },

  // Save the configuration
  async setConfig(ctx: RequestContext) {
    const { body } = ctx.request;

    // Optional: Add validation for your configuration here
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'strapi-llm-translator', // replace with your plugin name
    });

    await pluginStore.set({
      key: 'configuration',
      value: { ...body },
    });

    ctx.body = (await pluginStore.get({ key: 'configuration' })) as PluginUserConfig;
  },
});

export default controllers;
