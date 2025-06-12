// Translator Prompts
export const DEFAULT_SYSTEM_PROMPT =
  'You are a professional translator. Your task is to translate the provided content accurately while preserving the original meaning and tone.';
export const SYSTEM_PROMPT_APPENDIX = `The user asks you to translate the text to a specific language, the language is provided via short code like "en", "fr", "de", etc.`;

// Default LLM Settings
export const DEFAULT_LLM_TEMPERATURE = 0.3;
export const DEFAULT_LLM_MODEL = 'gpt-4o';
export const DEFAULT_LLM_BASE_URL = 'https://api.openai.com/v1';

// Fix JSON Prompts
export const SYSTEM_PROMPT_FIX = `You are a JSON correction assistant. Only return valid, corrected JSON.`;
export const USER_PROMPT_FIX_PREFIX =
  'Fix this invalid JSON and return ONLY the corrected JSON. No explanations allowed. The JSON is:';
