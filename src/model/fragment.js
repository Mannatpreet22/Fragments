// src/model/fragment.js

const crypto = require('crypto');
const data = require('./data');
const logger = require('../logger');

/**
 * Fragment class for managing user fragments
 */
class Fragment {
  constructor({ ownerId, type, size = 0, data = null }) {
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.data = data;
    this.id = crypto.randomUUID();
    this.created = new Date().toISOString();
    this.updated = new Date().toISOString();
    
    logger.debug({ 
      id: this.id, 
      ownerId: this.ownerId, 
      type: this.type, 
      size: this.size 
    }, 'Fragment created');
  }

  /**
   * Check if a content type is supported
   * @param {string} type - The content type to check
   * @returns {boolean} True if supported
   */
  static isSupportedType(type) {
    const supportedTypes = [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'text/markdown',
      'text/xml',
      'application/xml',
    ];
    
    const isSupported = supportedTypes.includes(type);
    logger.debug({ type, isSupported }, 'Checking if content type is supported');
    
    return isSupported;
  }

  /**
   * Get the file extension for a content type
   * @param {string} type - The content type
   * @returns {string} The file extension
   */
  static getExtension(type) {
    const extensions = {
      'text/plain': '.txt',
      'text/html': '.html',
      'text/css': '.css',
      'text/javascript': '.js',
      'application/json': '.json',
      'text/markdown': '.md',
      'text/xml': '.xml',
      'application/xml': '.xml',
    };
    
    const extension = extensions[type] || '.txt';
    logger.debug({ type, extension }, 'Getting file extension for content type');
    
    return extension;
  }

  /**
   * Save the fragment to the database
   * @returns {Promise<Fragment>} The saved fragment
   */
  async save() {
    logger.debug({ id: this.id, ownerId: this.ownerId }, 'Saving fragment');
    
    const fragmentData = {
      id: this.id,
      ownerId: this.ownerId,
      type: this.type,
      size: this.size,
      created: this.created,
      updated: this.updated,
    };
    
    await data.writeFragment(fragmentData);
    
    // If there's data, save it separately
    if (this.data) {
      await data.writeFragmentData(this.ownerId, this.id, this.data);
    }
    
    logger.info({ id: this.id, ownerId: this.ownerId }, 'Fragment saved successfully');
    return this;
  }

  /**
   * Load a fragment by ID
   * @param {string} ownerId - The owner ID
   * @param {string} id - The fragment ID
   * @returns {Promise<Fragment|null>} The loaded fragment or null
   */
  static async byId(ownerId, id) {
    logger.debug({ ownerId, id }, 'Loading fragment by ID');
    
    const fragmentData = await data.readFragment(ownerId, id);
    
    if (!fragmentData) {
      logger.debug({ ownerId, id }, 'Fragment not found');
      return null;
    }
    
    const fragment = new Fragment({
      ownerId: fragmentData.ownerId,
      type: fragmentData.type,
      size: fragmentData.size,
    });
    
    fragment.id = fragmentData.id;
    fragment.created = fragmentData.created;
    fragment.updated = fragmentData.updated;
    
    logger.debug({ id, ownerId }, 'Fragment loaded successfully');
    return fragment;
  }

  /**
   * Load fragment data (binary content)
   * @param {string} ownerId - The owner ID
   * @param {string} id - The fragment ID
   * @returns {Promise<Buffer|null>} The fragment data or null
   */
  static async byIdData(ownerId, id) {
    logger.debug({ ownerId, id }, 'Loading fragment data by ID');
    
    const dataBuffer = await data.readFragmentData(ownerId, id);
    
    if (!dataBuffer) {
      logger.debug({ ownerId, id }, 'Fragment data not found');
      return null;
    }
    
    logger.debug({ id, ownerId, size: dataBuffer.length }, 'Fragment data loaded successfully');
    return dataBuffer;
  }

  /**
   * Get all fragments for an owner
   * @param {string} ownerId - The owner ID
   * @param {boolean} expand - Whether to expand fragment data
   * @returns {Promise<Array>} Array of fragments
   */
  static async byUser(ownerId, expand = false) {
    logger.debug({ ownerId, expand }, 'Loading fragments by user');
    
    // Pass expand parameter to listFragments
    // When expand=false, returns array of IDs
    // When expand=true, returns array of full fragment objects
    const fragments = await data.listFragments(ownerId, expand);
    
    // If expand is true, we have full fragment objects, so load data for each
    if (expand && fragments && fragments.length > 0) {
      // Load data for each fragment
      for (const fragment of fragments) {
        const dataBuffer = await data.readFragmentData(ownerId, fragment.id);
        fragment.data = dataBuffer;
      }
    }
    
    logger.debug({ ownerId, count: fragments.length, expand }, 'Fragments loaded by user');
    return fragments;
  }

  /**
   * Delete a fragment
   * @param {string} ownerId - The owner ID
   * @param {string} id - The fragment ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(ownerId, id) {
    logger.debug({ ownerId, id }, 'Deleting fragment');
    
    const deleted = await data.deleteFragment(ownerId, id);
    
    if (deleted) {
      logger.info({ id, ownerId }, 'Fragment deleted successfully');
    } else {
      logger.warn({ id, ownerId }, 'Fragment deletion failed');
    }
    
    return deleted;
  }

  /**
   * Set fragment data
   * @param {Buffer} data - The data buffer
   */
  setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    
    this.data = data;
    this.size = data.length;
    this.updated = new Date().toISOString();
    
    logger.debug({ id: this.id, size: this.size }, 'Fragment data set');
  }

  /**
   * Get fragment data
   * @returns {Promise<Buffer|null>} The fragment data
   */
  async getData() {
    if (this.data) {
      return this.data;
    }
    
    logger.debug({ id: this.id, ownerId: this.ownerId }, 'Loading fragment data');
    this.data = await data.readFragmentData(this.ownerId, this.id);
    
    return this.data;
  }

  /**
   * Convert fragment to JSON (without data)
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      type: this.type,
      size: this.size,
      created: this.created,
      updated: this.updated,
    };
  }
}

module.exports = Fragment;
