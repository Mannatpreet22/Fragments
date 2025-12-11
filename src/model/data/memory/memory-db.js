const logger = require('../../../logger');

class MemoryDB {
  constructor() {
    this.db = new Map();
    logger.debug('MemoryDB initialized');
  }

  /**
   * Get a fragment by ID
   * @param {string} id - The fragment ID
   * @returns {Object|null} The fragment data or null if not found
   */
  get(id) {
    logger.debug({ id }, 'MemoryDB: getting fragment');
    return this.db.get(id) || null;
  }

  /**
   * Set a fragment by ID
   * @param {string} id - The fragment ID
   * @param {Object} fragment - The fragment data
   * @returns {Object} The stored fragment data
   */
  set(id, fragment) {
    logger.debug({ id, fragment }, 'MemoryDB: setting fragment');
    this.db.set(id, fragment);
    return fragment;
  }

  /**
   * Delete a fragment by ID
   * @param {string} id - The fragment ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    logger.debug({ id }, 'MemoryDB: deleting fragment');
    return this.db.delete(id);
  }

  /**
   * Get all fragments for a specific owner
   * @param {string} ownerId - The owner ID
   * @returns {Array} Array of fragment objects
   */
  getByOwner(ownerId) {
    logger.debug({ ownerId }, 'MemoryDB: getting fragments by owner');
    const fragments = [];
    for (const [id, fragment] of this.db.entries()) {
      if (fragment.ownerId === ownerId) {
        fragments.push({ id, ...fragment });
      }
    }
    return fragments;
  }

  /**
   * Check if a fragment exists
   * @param {string} id - The fragment ID
   * @returns {boolean} True if exists, false otherwise
   */
  has(id) {
    logger.debug({ id }, 'MemoryDB: checking if fragment exists');
    return this.db.has(id);
  }

  getAll() {
    logger.debug('MemoryDB: getting all fragments');
    const fragments = [];
    for (const [id, fragment] of this.db.entries()) {
      fragments.push({ id, ...fragment });
    }
    return fragments;
  }

  clear() {
    logger.debug('MemoryDB: clearing all fragments');
    this.db.clear();
  }

  /**
   * Get the total number of fragments
   * @returns {number} Number of fragments
   */
  size() {
    return this.db.size;
  }
}

const memoryDB = new MemoryDB();

module.exports = memoryDB;
