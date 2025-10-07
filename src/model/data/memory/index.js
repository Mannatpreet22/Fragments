// src/model/data/memory/index.js

const memoryDB = require('./memory-db');
const logger = require('../../../logger');

/**
 * Read a fragment by ID
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<Object|null>} The fragment data or null if not found
 */
async function readFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Reading fragment from memory DB');
  
  const fragment = memoryDB.get(id);
  
  if (!fragment) {
    logger.debug({ ownerId, id }, 'Fragment not found in memory DB');
    return null;
  }
  
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    return null;
  }
  
  logger.debug({ ownerId, id }, 'Fragment found in memory DB');
  return { id, ...fragment };
}

/**
 * Write a fragment
 * @param {Object} fragment - The fragment data
 * @returns {Promise<Object>} The stored fragment data
 */
async function writeFragment(fragment) {
  logger.debug({ fragment }, 'Writing fragment to memory DB');
  
  const { id, ...fragmentData } = fragment;
  const storedFragment = memoryDB.set(id, fragmentData);
  
  logger.info({ id, ownerId: fragmentData.ownerId }, 'Fragment written to memory DB');
  return { id, ...storedFragment };
}

/**
 * Read fragment data (binary content)
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<Buffer|null>} The fragment data buffer or null if not found
 */
async function readFragmentData(ownerId, id) {
  logger.debug({ ownerId, id }, 'Reading fragment data from memory DB');
  
  const fragment = memoryDB.get(id);
  
  if (!fragment) {
    logger.debug({ ownerId, id }, 'Fragment not found in memory DB');
    return null;
  }
  
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    return null;
  }
  
  if (!fragment.data) {
    logger.warn({ ownerId, id }, 'Fragment has no data');
    return null;
  }
  
  logger.debug({ ownerId, id }, 'Fragment data found in memory DB');
  return fragment.data;
}

/**
 * Write fragment data (binary content)
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @param {Buffer} data - The fragment data buffer
 * @returns {Promise<Object>} The updated fragment data
 */
async function writeFragmentData(ownerId, id, data) {
  logger.debug({ ownerId, id, dataSize: data.length }, 'Writing fragment data to memory DB');
  
  const fragment = memoryDB.get(id);
  
  if (!fragment) {
    logger.warn({ ownerId, id }, 'Fragment not found, cannot write data');
    throw new Error('Fragment not found');
  }
  
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    throw new Error('Fragment owner mismatch');
  }
  
  // Update the fragment with new data
  const updatedFragment = {
    ...fragment,
    data,
    size: data.length,
  };
  
  memoryDB.set(id, updatedFragment);
  
  logger.info({ ownerId, id, size: data.length }, 'Fragment data written to memory DB');
  return { id, ...updatedFragment };
}

/**
 * Get all fragments for an owner
 * @param {string} ownerId - The owner ID
 * @returns {Promise<Array>} Array of fragment objects
 */
async function listFragments(ownerId) {
  logger.debug({ ownerId }, 'Listing fragments for owner from memory DB');
  
  const fragments = memoryDB.getByOwner(ownerId);
  
  logger.debug({ ownerId, count: fragments.length }, 'Fragments listed from memory DB');
  return fragments;
}

/**
 * Delete a fragment
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Deleting fragment from memory DB');
  
  const fragment = memoryDB.get(id);
  
  if (!fragment) {
    logger.debug({ ownerId, id }, 'Fragment not found in memory DB');
    return false;
  }
  
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    return false;
  }
  
  const deleted = memoryDB.delete(id);
  
  if (deleted) {
    logger.info({ ownerId, id }, 'Fragment deleted from memory DB');
  }
  
  return deleted;
}

module.exports = {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
};