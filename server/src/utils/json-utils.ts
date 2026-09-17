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

const escapeControlCharacters = (content: string): string => {
  let result = '';
  let inString = false;
  let escaping = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const charCode = content.charCodeAt(i);

    if (escaping) {
      result += char;
      escaping = false;
      continue;
    }

    if (char === '\\' && inString) {
      result += char;
      escaping = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && charCode < 0x20) {
      const escapes: Record<number, string> = {
        0x08: '\\b',
        0x09: '\\t',
        0x0a: '\\n',
        0x0c: '\\f',
        0x0d: '\\r',
      };
      result += escapes[charCode] ?? `\\u${charCode.toString(16).padStart(4, '0')}`;
      continue;
    }

    result += char;
  }

  return result;
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
  const parsed = JSON.parse(escapeControlCharacters(content));
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed;
  }
  throw new Error('Invalid response format - not an object');
};