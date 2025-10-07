// src/model/data/index.js

/**
 * Data strategy selector
 * Currently only supports memory strategy, but will be extended
 * to support AWS data stores (DynamoDB, S3) in the future
 */

// For now, we only have the memory strategy
module.exports = require('./memory');