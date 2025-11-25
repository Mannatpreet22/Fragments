// src/model/data/index.js

/**
 * Data strategy selector
 * If the environment sets an AWS Region, we'll use AWS backend
 * services (S3, DynamoDB); otherwise, we'll use an in-memory db.
 */

const logger = require('../../logger');

// If the environment sets an AWS Region, we'll use AWS backend
// services (S3, DynamoDB); otherwise, we'll use an in-memory db.
const hasAwsRegion = !!process.env.AWS_REGION;
const backend = hasAwsRegion ? 'AWS (S3)' : 'Memory';

logger.info({ 
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  backend,
  hasAwsRegion
}, 'Data backend selected');

module.exports = hasAwsRegion ? require('./aws') : require('./memory');
