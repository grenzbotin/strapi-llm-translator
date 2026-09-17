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

const isEscapedQuote = (content: string, index: number): boolean => {
  let backslashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && content[cursor] === '\\') {
    backslashCount += 1;
    cursor -= 1;
  }

  return backslashCount % 2 === 1;
};

const findNextNonWhitespaceIndex = (content: string, startIndex: number): number | null => {
  for (let i = startIndex; i < content.length; i += 1) {
    if (!/\s/.test(content[i])) {
      return i;
    }
  }

  return null;
};

export const escapeJSONQuote = (content: string): string => {
  let inString = false;
  let output = '';

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (char !== '"') {
      output += char;
      continue;
    }

    if (isEscapedQuote(content, i)) {
      output += char;
      continue;
    }

    if (!inString) {
      inString = true;
      output += char;
      continue;
    }

    const nextNonWhitespaceIndex = findNextNonWhitespaceIndex(content, i + 1);
    const nextNonWhitespaceChar =
      nextNonWhitespaceIndex === null ? null : content[nextNonWhitespaceIndex];

    let isStringDelimiter =
      nextNonWhitespaceChar === null ||
      nextNonWhitespaceChar === ':' ||
      nextNonWhitespaceChar === '}' ||
      nextNonWhitespaceChar === ']';

    if (!isStringDelimiter && nextNonWhitespaceChar === ',') {
      const charAfterCommaIndex = findNextNonWhitespaceIndex(content, nextNonWhitespaceIndex + 1);
      const charAfterComma =
        charAfterCommaIndex === null ? null : content[charAfterCommaIndex];

      isStringDelimiter =
        charAfterComma === null ||
        charAfterComma === '"' ||
        charAfterComma === '{' ||
        charAfterComma === '[' ||
        charAfterComma === '}' ||
        charAfterComma === ']';
    }

    if (isStringDelimiter) {
      inString = false;
      output += char;
    } else {
      output += '\\"';
    }
  }

  return output;
};

export const safeJSONParse = (content: string): Record<string, any> => {
  const parsed = JSON.parse(content);
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed;
  }
  throw new Error('Invalid response format - not an object');
};
