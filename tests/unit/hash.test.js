// tests/unit/hash.test.js

const { hash, hashEmail, isValidEmail } = require('../../src/hash');

describe('Hash Utilities', () => {
  describe('hash', () => {
    test('hashes a string correctly', () => {
      const input = 'test string';
      const result = hash(input);
      
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(64); // SHA-256 produces 64 hex characters
      expect(result).toMatch(/^[a-f0-9]+$/); // Should be hex string
    });

    test('produces consistent hashes for same input', () => {
      const input = 'test string';
      const hash1 = hash(input);
      const hash2 = hash(input);
      
      expect(hash1).toBe(hash2);
    });

    test('produces different hashes for different inputs', () => {
      const input1 = 'test string 1';
      const input2 = 'test string 2';
      
      const hash1 = hash(input1);
      const hash2 = hash(input2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('throws error for empty string', () => {
      expect(() => hash('')).toThrow('Input must be a non-empty string');
    });

    test('throws error for null input', () => {
      expect(() => hash(null)).toThrow('Input must be a non-empty string');
    });

    test('throws error for undefined input', () => {
      expect(() => hash(undefined)).toThrow('Input must be a non-empty string');
    });

    test('throws error for non-string input', () => {
      expect(() => hash(123)).toThrow('Input must be a non-empty string');
      expect(() => hash({})).toThrow('Input must be a non-empty string');
      expect(() => hash([])).toThrow('Input must be a non-empty string');
    });
  });

  describe('hashEmail', () => {
    test('hashes a valid email correctly', () => {
      const email = 'test@example.com';
      const result = hashEmail(email);
      
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(64); // SHA-256 produces 64 hex characters
      expect(result).toMatch(/^[a-f0-9]+$/); // Should be hex string
    });

    test('normalizes email to lowercase', () => {
      const email1 = 'TEST@EXAMPLE.COM';
      const email2 = 'test@example.com';
      
      const hash1 = hashEmail(email1);
      const hash2 = hashEmail(email2);
      
      expect(hash1).toBe(hash2);
    });

    test('trims whitespace from email', () => {
      const email1 = ' test@example.com ';
      const email2 = 'test@example.com';
      
      const hash1 = hashEmail(email1);
      const hash2 = hashEmail(email2);
      
      expect(hash1).toBe(hash2);
    });

    test('produces consistent hashes for same email', () => {
      const email = 'test@example.com';
      const hash1 = hashEmail(email);
      const hash2 = hashEmail(email);
      
      expect(hash1).toBe(hash2);
    });

    test('produces different hashes for different emails', () => {
      const email1 = 'test1@example.com';
      const email2 = 'test2@example.com';
      
      const hash1 = hashEmail(email1);
      const hash2 = hashEmail(email2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('throws error for invalid email format', () => {
      expect(() => hashEmail('invalid-email')).toThrow('Invalid email format');
      expect(() => hashEmail('test@')).toThrow('Invalid email format');
      expect(() => hashEmail('@example.com')).toThrow('Invalid email format');
      expect(() => hashEmail('test.example.com')).toThrow('Invalid email format');
    });

    test('throws error for empty email', () => {
      expect(() => hashEmail('')).toThrow('Email must be a non-empty string');
    });

    test('throws error for null email', () => {
      expect(() => hashEmail(null)).toThrow('Email must be a non-empty string');
    });

    test('throws error for undefined email', () => {
      expect(() => hashEmail(undefined)).toThrow('Email must be a non-empty string');
    });

    test('throws error for non-string email', () => {
      expect(() => hashEmail(123)).toThrow('Email must be a non-empty string');
      expect(() => hashEmail({})).toThrow('Email must be a non-empty string');
    });
  });

  describe('isValidEmail', () => {
    test('returns true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
      expect(isValidEmail('123@456.com')).toBe(true);
    });

    test('returns false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test@example.')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('test@@example.com')).toBe(false);
    });
  });
});