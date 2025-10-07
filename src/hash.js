// src/hash.js

const crypto = require('crypto');
const logger = require('./logger');

/**
 * Hash a string using SHA-256
 * @param {string} input - The string to hash
 * @returns {string} The hashed string in hex format
 */
function hash(input) {
  logger.debug({ input }, 'Hashing input string');
  
  if (!input || typeof input !== 'string') {
    logger.warn({ input }, 'Invalid input for hashing');
    throw new Error('Input must be a non-empty string');
  }
  
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  
  logger.debug({ input, hash }, 'Input hashed successfully');
  return hash;
}

/**
 * Hash an email address for privacy
 * @param {string} email - The email address to hash
 * @returns {string} The hashed email address
 */
function hashEmail(email) {
  logger.debug({ email }, 'Hashing email address');
  
  if (!email || typeof email !== 'string') {
    logger.warn({ email }, 'Invalid email for hashing');
    throw new Error('Email must be a non-empty string');
  }
  
  // Normalize email to lowercase and trim whitespace
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!isValidEmail(normalizedEmail)) {
    logger.warn({ email }, 'Invalid email format');
    throw new Error('Invalid email format');
  }
  
  const hashedEmail = hash(normalizedEmail);
  
  logger.info({ email: normalizedEmail, hashedEmail }, 'Email hashed successfully');
  return hashedEmail;
}

/**
 * Simple email validation
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  hash,
  hashEmail,
  isValidEmail,
};