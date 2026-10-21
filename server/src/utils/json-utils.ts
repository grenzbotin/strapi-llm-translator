export const cleanJSONString = (content: string): string => {
  return content
    .replace(/^```json\s*\n/, '')
    .replace(/^```\s*\n/, '')
    .replace(/\n\s*```$/, '')
    .replace(/\u200B/g, '')
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

export const generateJsonSchema = (data: any): Record<string, any> => {
  if (data === null || data === undefined) {
    return { type: 'string' };
  }

  if (Array.isArray(data)) {
    const itemSchema = data.length > 0 ? generateJsonSchema(data[0]) : { type: 'string' };
    return {
      type: 'array',
      items: itemSchema,
    };
  }

  if (typeof data === 'object') {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key of Object.keys(data)) {
      properties[key] = generateJsonSchema(data[key]);
      required.push(key);
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    };
  }

  if (typeof data === 'number') {
    return { type: 'number' };
  }

  if (typeof data === 'boolean') {
    return { type: 'boolean' };
  }

  return { type: 'string' };
};

export const safeJSONParse = (content: string): Record<string, any> => {
  const parsed = JSON.parse(content);
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed;
  }
  throw new Error('Invalid response format - not an object');
};
