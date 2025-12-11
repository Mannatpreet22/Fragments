const logger = require('../../logger');

const hasAwsRegion = !!process.env.AWS_REGION;
const backend = hasAwsRegion ? 'AWS (S3)' : 'Memory';

logger.info({ 
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  backend,
  hasAwsRegion
}, 'Data backend selected');

module.exports = hasAwsRegion ? require('./aws') : require('./memory');
