const sharp = require('sharp');
const MarkdownIt = require('markdown-it');
const logger = require('./logger');

const md = new MarkdownIt();

/**
 * Map file extensions to MIME types
 * @param {string} extension - File extension (e.g., '.html')
 * @returns {string|null} MIME type or null if not found
 */
function extensionToMimeType(extension) {
  const extensionMap = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.gif': 'image/gif',
  };
  
  return extensionMap[extension.toLowerCase()] || null;
}

/**
 * Check if a conversion is supported
 * @param {string} fromType - Source MIME type
 * @param {string} toType - Target MIME type
 * @returns {boolean} True if conversion is supported
 */
function canConvert(fromType, toType) {
  if (fromType === toType) {
    return true;
  }
  
  const textTypes = [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    'application/json',
  ];
  
  const isTextType = (type) => textTypes.includes(type);
  
  const imageTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/avif',
    'image/gif',
  ];
  
  const isImageType = (type) => imageTypes.includes(type);
  
  if (isTextType(fromType) && isTextType(toType)) {
    return true;
  }
  
  if (isImageType(fromType) && isImageType(toType)) {
    return true;
  }
  

  return false;
}

/**
 * Convert text fragment data
 * @param {Buffer} data - Source data buffer
 * @param {string} fromType - Source MIME type
 * @param {string} toType - Target MIME type
 * @returns {Promise<Buffer>} Converted data buffer
 */
async function convertText(data, fromType, toType) {
  logger.debug({ fromType, toType }, 'Converting text fragment');
  

  if (fromType === toType) {
    return data;
  }
  
  const text = data.toString('utf-8');
  let result;
  

  if (fromType === 'text/markdown' && toType === 'text/html') {
    result = md.render(text);
  }

  else if (fromType === 'text/plain' && toType === 'text/html') {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    result = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>${escaped}</pre></body></html>`;
  }

  else if (fromType === 'text/markdown' && toType === 'text/plain') {
    const html = md.render(text);
    result = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();
  }

  else if (fromType === 'text/plain' && toType === 'text/markdown') {
    if (text.includes('\n') || text.length > 50) {
      result = '```\n' + text + '\n```';
    } else {
      result = text;
    }
  }

  else if (fromType === 'text/html' && toType === 'text/plain') {
    result = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  else if (fromType === 'text/html' && toType === 'text/markdown') {
    const plainText = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    result = plainText;
  }

  else if ((fromType === 'text/css' || fromType === 'text/javascript') && toType === 'text/plain') {
    result = text;
  }

  else if (fromType === 'application/json' && toType === 'text/plain') {
    try {
      const json = JSON.parse(text);
      result = JSON.stringify(json, null, 2);
    } catch {
      result = text;
    }
  }

  else if (fromType === 'text/plain' && toType === 'application/json') {
    result = JSON.stringify(text);
  }

  else if ((fromType === 'text/css' || fromType === 'text/javascript') && toType === 'application/json') {
    result = JSON.stringify(text);
  }

  else if (fromType === 'text/markdown' && toType === 'application/json') {
    result = JSON.stringify(text);
  }

  else if (fromType === 'text/html' && toType === 'application/json') {
    result = JSON.stringify(text);
  }

  else if (fromType === 'application/json' && toType === 'text/html') {
    try {
      const json = JSON.parse(text);
      const formatted = JSON.stringify(json, null, 2);
      const escaped = formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      result = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>${escaped}</pre></body></html>`;
    } catch {
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      result = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>${escaped}</pre></body></html>`;
    }
  }

  else if (fromType === 'application/json' && toType === 'text/markdown') {
    try {
      const json = JSON.parse(text);
      const formatted = JSON.stringify(json, null, 2);
      const escaped = formatted.replace(/"/g, '&quot;');
      result = '```json\n' + escaped + '\n```';
    } catch {
      const escaped = text.replace(/"/g, '&quot;');
      result = '```json\n' + escaped + '\n```';
    }
  }

  else if ((fromType === 'text/css' || fromType === 'text/javascript') && toType === 'text/html') {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const tag = fromType === 'text/css' ? 'style' : 'script';
    result = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><${tag}>${escaped}</${tag}></body></html>`;
  }

  else if ((fromType === 'text/css' || fromType === 'text/javascript') && toType === 'text/markdown') {
    const lang = fromType === 'text/css' ? 'css' : 'javascript';
    result = '```' + lang + '\n' + text + '\n```';
  }

  else if (fromType === 'text/plain' && toType === 'text/css') {
    result = `/* ${text.replace(/\*\//g, '* /')} */`;
  }

  else if (fromType === 'text/plain' && toType === 'text/javascript') {
    result = `// ${text.replace(/\n/g, '\n// ')}`;
  }

  else if (fromType === 'text/html' && toType === 'text/css') {
    const plainText = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    result = `/* ${plainText.replace(/\*\//g, '* /')} */`;
  }

  else if (fromType === 'text/html' && toType === 'text/javascript') {
    const plainText = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    result = `// ${plainText.replace(/\n/g, '\n// ')}`;
  }

  else if (fromType === 'text/css' && toType === 'text/javascript') {
    result = `/* ${text.replace(/\*\//g, '* /')} */`;
  }

  else if (fromType === 'text/javascript' && toType === 'text/css') {
    result = `/* ${text.replace(/\*\//g, '* /')} */`;
  }

  else if (fromType === 'text/markdown' && toType === 'text/css') {
    const html = md.render(text);
    const plainText = html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    result = `/* ${plainText.replace(/\*\//g, '* /')} */`;
  }

  else if (fromType === 'text/markdown' && toType === 'text/javascript') {
    const html = md.render(text);
    const plainText = html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    result = `// ${plainText.replace(/\n/g, '\n// ')}`;
  }

  else if (fromType === 'application/json' && toType === 'text/css') {
    try {
      const json = JSON.parse(text);
      const jsonStr = JSON.stringify(json);
      result = `/* ${jsonStr.replace(/\*\//g, '* /')} */`;
    } catch {
      result = `/* ${text.replace(/\*\//g, '* /')} */`;
    }
  }

  else if (fromType === 'application/json' && toType === 'text/javascript') {
    try {
      const json = JSON.parse(text);
      result = `const data = ${JSON.stringify(json, null, 2)};`;
    } catch {
      result = `// ${text.replace(/\n/g, '\n// ')}`;
    }
  }

  else {
    throw new Error(`Unsupported text conversion from ${fromType} to ${toType}`);
  }
  
  return Buffer.from(result, 'utf-8');
}

/**
 * Convert image fragment data
 * @param {Buffer} data - Source image data buffer
 * @param {string} fromType - Source MIME type
 * @param {string} toType - Target MIME type
 * @returns {Promise<Buffer>} Converted image data buffer
 */
async function convertImage(data, fromType, toType) {
  logger.debug({ fromType, toType }, 'Converting image fragment');
  

  if (fromType === toType) {
    return data;
  }
  
  let sharpInstance = sharp(data);
  

  let outputFormat;
  switch (toType) {
    case 'image/png':
      outputFormat = 'png';
      break;
    case 'image/jpeg':
      outputFormat = 'jpeg';
      break;
    case 'image/webp':
      outputFormat = 'webp';
      break;
    case 'image/avif':
      outputFormat = 'avif';
      break;
    case 'image/gif':
      outputFormat = 'gif';
      break;
    default:
      throw new Error(`Unsupported image target type: ${toType}`);
  }
  

  const converted = await sharpInstance.toFormat(outputFormat).toBuffer();
  
  logger.info({ fromType, toType, originalSize: data.length, convertedSize: converted.length }, 'Image converted successfully');
  
  return converted;
}

/**
 * Convert fragment data from one type to another
 * @param {Buffer} data - Source data buffer
 * @param {string} fromType - Source MIME type
 * @param {string} toType - Target MIME type
 * @returns {Promise<Buffer>} Converted data buffer
 */
async function convert(data, fromType, toType) {
  logger.debug({ fromType, toType, dataSize: data.length }, 'Converting fragment data');
  

  if (!canConvert(fromType, toType)) {
    throw new Error(`Conversion from ${fromType} to ${toType} is not supported`);
  }
  

  const textTypes = [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    'application/json',
  ];
  
  const imageTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/avif',
    'image/gif',
  ];
  
  if (textTypes.includes(fromType) && textTypes.includes(toType)) {
    return convertText(data, fromType, toType);
  } else if (imageTypes.includes(fromType) && imageTypes.includes(toType)) {
    return convertImage(data, fromType, toType);
  } else {
    throw new Error(`Unsupported conversion from ${fromType} to ${toType}`);
  }
}

module.exports = {
  convert,
  canConvert,
  extensionToMimeType,
};
