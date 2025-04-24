export const cleanJSONString = (content: string): string => {
  return content
    .replace(/^```json\s*\n/, '')
    .replace(/^```\s*\n/, '')
    .replace(/\n\s*```$/, '')
    .replace(/\u200B/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
};

export const balanceJSONBraces = (content: string): string => {
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;

  if (openBraces > closeBraces) {
    return content + '}'.repeat(openBraces - closeBraces);
  }
  return content;
};

export const safeJSONParse = (content: string): Record<string, any> => {
  const parsed = JSON.parse(content);
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed;
  }
  throw new Error('Invalid response format - not an object');
};
