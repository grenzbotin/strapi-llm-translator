# <img alt="Strapi LLM Translator Icon" src="./docs/strapi-llm-translator-icon.png" width="50"> Strapi LLM Translator

#### AI-Powered Content Translation for Strapi

The Strapi LLM Translator plugin enhances your localization workflow by utilising LLMs to translate your content fields with a single click. Compatible with any OpenAI-compatible LLM, it preserves your original formatting while delivering fast, accurate results in seconds.

## 🚀 Key Features

- 🌍 **Multi-field Support** - Translates all text-based fields (string, text, richtext)
- 🔌 **LLM Agnostic** - Works with any OpenAI-compatible API (your choice of provider)
- 📝 **Format Preservation** - Maintains markdown formatting during translation
- 🔗 **Smart UUID Handling** - Auto-translates slugs when i18n is enabled with relative fields
- ⚡ **Auto-fill** - Instantly populates generated translations
- 🎛️ **Customizable** - Adjust system prompts and temperature for optimal results

---

<img alt="strapi-llm-translator" style="border-radius:5px" src="./docs/strapi-llm-translator.gif" width="640">

---

## ✅ Tested With

- **Strapi**: v5.12.4
- **LLM Providers**:
  - OpenAI: `gpt-4o`
  - Groq: `meta-llama/llama-4-scout-17b-16e-instruct`

## 🛠️ Installation & Setup

### Prerequisites

- Strapi project (v5+)
- API key for your preferred LLM provider, opt. BaseUrl + model name

### Installation

1. Install the plugin in your Strapi project:

```bash
npm install strapi-llm-translator
```

2. Configure environment variables:

```
# Required - Your LLM provider API key
LLM_TRANSLATOR_LLM_API_KEY=

# Optional - Defaults to OpenAI's endpoint
STRAPI_ADMIN_LLM_TRANSLATOR_LLM_BASE_URL=

# Optional - Defaults to gpt-4o
STRAPI_ADMIN_LLM_TRANSLATOR_LLM_MODEL=
```

3. Rebuild your admin panel:

```
npm run build
```

After installation, customize the translation behavior through the LLM Translator configuration page:

---

<img alt="Strapi LLM Translator Configuration screen" style="border-radius:5px" src="./docs/strapi-llm-translator-configuration.png" width="640">

---

## 💻 Plugin Development

To contribute to the plugin development:

1. Navigate to your Strapi project
2. Add and link the plugin: `npx yalc add strapi-llm-translator && npx yalc link strapi-llm-translator && npm install`
3. Start your Strapi project
4. In a separate terminal, watch the plugin for changes:
   `npm run watch:link`

## About

Franziska Fieke ([grenzbotin](https://github.com/grenzbotin)) – [vulpis.dev](https://vulpis.dev)

Distributed under the MIT license.
See `LICENSE` for more information.
