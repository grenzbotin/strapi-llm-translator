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
   let openBraces = 0;
  let closeBraces = 0;
  let inString = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (char === '"' && content[i - 1] !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '{') openBraces += 1;
      if (char === '}') closeBraces += 1;
    }
  }

  if (openBraces > closeBraces) {
    return content + '}'.repeat(openBraces - closeBraces);
  }
  return content;
};

export const extractJSONObject = (content: string): string => {
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return content.slice(firstBrace, lastBrace + 1);
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