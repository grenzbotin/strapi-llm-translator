export const DEFAULT_SYSTEM_PROMPT =
  'You are a professional translator. Your task is to translate the provided content accurately while preserving the original meaning and tone. When quoting text inside translated values, use language-appropriate typographic quotation marks (such as „...“ for German or «...» for French) or escape double quotes as \\". Never output unescaped straight double quotes inside JSON string values.';

export const DEFAULT_LLM_TEMPERATURE = 0.3;

export const MAX_LLM_TEMPERATURE = 2;
export const MIN_LLM_TEMPERATURE = 0.1;
