// tests/unit/converter.test.js

const converter = require('../../src/converter');
const sharp = require('sharp');

// Mock sharp
jest.mock('sharp');

describe('Converter', () => {
  describe('extensionToMimeType', () => {
    test('maps text extensions correctly', () => {
      expect(converter.extensionToMimeType('.txt')).toBe('text/plain');
      expect(converter.extensionToMimeType('.html')).toBe('text/html');
      expect(converter.extensionToMimeType('.css')).toBe('text/css');
      expect(converter.extensionToMimeType('.js')).toBe('text/javascript');
      expect(converter.extensionToMimeType('.md')).toBe('text/markdown');
    });

    test('maps data extensions correctly', () => {
      expect(converter.extensionToMimeType('.json')).toBe('application/json');
    });

    test('maps image extensions correctly', () => {
      expect(converter.extensionToMimeType('.png')).toBe('image/png');
      expect(converter.extensionToMimeType('.jpg')).toBe('image/jpeg');
      expect(converter.extensionToMimeType('.jpeg')).toBe('image/jpeg');
      expect(converter.extensionToMimeType('.webp')).toBe('image/webp');
      expect(converter.extensionToMimeType('.avif')).toBe('image/avif');
      expect(converter.extensionToMimeType('.gif')).toBe('image/gif');
    });

    test('returns null for unknown extensions', () => {
      expect(converter.extensionToMimeType('.unknown')).toBeNull();
      expect(converter.extensionToMimeType('.xyz')).toBeNull();
    });

    test('handles case insensitive extensions', () => {
      expect(converter.extensionToMimeType('.PNG')).toBe('image/png');
      expect(converter.extensionToMimeType('.JPG')).toBe('image/jpeg');
      expect(converter.extensionToMimeType('.JSON')).toBe('application/json');
    });
  });

  describe('canConvert', () => {
    test('returns true for same type', () => {
      expect(converter.canConvert('text/plain', 'text/plain')).toBe(true);
      expect(converter.canConvert('image/png', 'image/png')).toBe(true);
    });

    test('returns true for text-to-text conversions', () => {
      expect(converter.canConvert('text/markdown', 'text/html')).toBe(true);
      expect(converter.canConvert('application/json', 'text/plain')).toBe(true);
      expect(converter.canConvert('text/plain', 'application/json')).toBe(true);
    });

    test('returns true for image-to-image conversions', () => {
      expect(converter.canConvert('image/jpeg', 'image/png')).toBe(true);
      expect(converter.canConvert('image/png', 'image/webp')).toBe(true);
      expect(converter.canConvert('image/gif', 'image/avif')).toBe(true);
    });

    test('returns false for cross-type conversions', () => {
      expect(converter.canConvert('text/plain', 'image/png')).toBe(false);
      expect(converter.canConvert('image/jpeg', 'text/html')).toBe(false);
      expect(converter.canConvert('application/json', 'image/png')).toBe(false);
    });
  });

  describe('convert - text conversions', () => {
    test('converts markdown to HTML', async () => {
      const markdown = Buffer.from('# Hello\n\nThis is **bold** text.');
      const result = await converter.convert(markdown, 'text/markdown', 'text/html');
      const html = result.toString('utf-8');
      expect(html).toContain('<h1>Hello</h1>');
      expect(html).toContain('<strong>bold</strong>');
    });

    test('converts JSON to HTML', async () => {
      const json = Buffer.from('{"name": "test", "value": 123}');
      const result = await converter.convert(json, 'application/json', 'text/html');
      const html = result.toString('utf-8');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('&quot;name&quot;: &quot;test&quot;');
    });

    test('converts JSON to Markdown', async () => {
      const json = Buffer.from('{"name": "test", "value": 123}');
      const result = await converter.convert(json, 'application/json', 'text/markdown');
      const md = result.toString('utf-8');
      expect(md).toContain('```json');
      expect(md).toContain('&quot;name&quot;: &quot;test&quot;');
    });

    test('converts text to CSS', async () => {
      const text = Buffer.from('test');
      const result = await converter.convert(text, 'text/plain', 'text/css');
      const css = result.toString('utf-8');
      expect(css).toContain('/*');
      expect(css).toContain('test');
    });

    test('converts text to JavaScript', async () => {
      const text = Buffer.from('test');
      const result = await converter.convert(text, 'text/plain', 'text/javascript');
      const js = result.toString('utf-8');
      expect(js).toContain('//');
      expect(js).toContain('test');
    });

    test('converts text to HTML', async () => {
      const text = Buffer.from('Hello <world> & "test"');
      const result = await converter.convert(text, 'text/plain', 'text/html');
      const html = result.toString('utf-8');
      expect(html).toContain('&lt;world&gt;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;test&quot;');
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('returns same data for same type', async () => {
      const data = Buffer.from('test data');
      const result = await converter.convert(data, 'text/plain', 'text/plain');
      expect(result).toEqual(data);
    });

    test('throws error for unsupported text conversion', async () => {
      const data = Buffer.from('test');
      // Try converting to an unsupported type (like video/mp4)
      await expect(
        converter.convert(data, 'text/plain', 'video/mp4')
      ).rejects.toThrow('Conversion from text/plain to video/mp4 is not supported');
    });
  });

  describe('convert - image conversions', () => {
    beforeEach(() => {
      // Mock sharp instance
      const mockSharp = {
        toFormat: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('converted image')),
      };
      sharp.mockReturnValue(mockSharp);
    });

    test('converts JPEG to PNG', async () => {
      const jpegData = Buffer.from('fake jpeg data');
      const result = await converter.convert(jpegData, 'image/jpeg', 'image/png');
      
      expect(sharp).toHaveBeenCalledWith(jpegData);
      expect(result).toBeDefined();
    });

    test('converts PNG to WebP', async () => {
      const pngData = Buffer.from('fake png data');
      const result = await converter.convert(pngData, 'image/png', 'image/webp');
      
      expect(sharp).toHaveBeenCalledWith(pngData);
      expect(result).toBeDefined();
    });

    test('converts GIF to AVIF', async () => {
      const gifData = Buffer.from('fake gif data');
      const result = await converter.convert(gifData, 'image/gif', 'image/avif');
      
      expect(sharp).toHaveBeenCalledWith(gifData);
      expect(result).toBeDefined();
    });

    test('returns same data for same image type', async () => {
      const data = Buffer.from('fake image');
      const result = await converter.convert(data, 'image/png', 'image/png');
      expect(result).toEqual(data);
    });

    test('throws error for unsupported image target type', async () => {
      const data = Buffer.from('fake image');
      await expect(
        converter.convert(data, 'image/png', 'image/bmp')
      ).rejects.toThrow('Conversion from image/png to image/bmp is not supported');
    });
  });

  describe('convert - error handling', () => {
    test('throws error for unsupported conversion', async () => {
      const data = Buffer.from('test');
      await expect(
        converter.convert(data, 'text/plain', 'image/png')
      ).rejects.toThrow('Conversion from text/plain to image/png is not supported');
    });

    test('throws error for invalid JSON in JSON to HTML conversion', async () => {
      const invalidJson = Buffer.from('{ invalid json }');
      // JSON parsing will fail, but HTML conversion should handle it gracefully
      const result = await converter.convert(invalidJson, 'application/json', 'text/html');
      expect(result).toBeDefined();
    });
  });
});


