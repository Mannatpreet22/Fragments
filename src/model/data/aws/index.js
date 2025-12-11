const logger = require('../../../logger');
const s3Client = require('./s3Client');
const ddbDocClient = require('./ddbDocClient');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

async function readFragment(ownerId, id) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  const command = new GetCommand(params);
  try {
    const data = await ddbDocClient.send(command);
    if (!data?.Item) {
      logger.debug({ ownerId, id }, 'Fragment not found in DynamoDB');
      return null;
    }
    logger.debug({ ownerId, id }, 'Fragment found in DynamoDB');
    return data.Item;
  } catch (err) {
    logger.warn({ err, params }, 'error reading fragment from DynamoDB');
    throw err;
  }
}

async function writeFragment(fragment) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  const command = new PutCommand(params);
  try {
    await ddbDocClient.send(command);
    logger.info({ id: fragment.id, ownerId: fragment.ownerId }, 'Fragment written to DynamoDB');
    return fragment;
  } catch (err) {
    logger.warn({ err, params, fragment }, 'error writing fragment to DynamoDB');
    throw err;
  }
}

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new GetObjectCommand(params);
  try {
    const data = await s3Client.send(command);
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      logger.debug({ ownerId, id, Bucket, Key }, 'Fragment data not found in S3');
      return null;
    }
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  logger.info({ 
    Bucket: params.Bucket, 
    Key: params.Key, 
    ownerId, 
    id, 
    dataSize: data.length,
    hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
    hasRegion: !!process.env.AWS_REGION
  }, 'Attempting to write fragment data to S3');

  const command = new PutObjectCommand(params);
  try {
    await s3Client.send(command);
    logger.info({ Bucket: params.Bucket, Key: params.Key }, 'Successfully uploaded fragment data to S3');
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ 
      err, 
      errName: err.name,
      errMessage: err.message,
      errCode: err.Code,
      Bucket, 
      Key,
      ownerId,
      id
    }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }

  const fragment = await readFragment(ownerId, id);
  if (!fragment) {
    logger.warn({ ownerId, id }, 'Fragment not found in DynamoDB, but data uploaded to S3');
    throw new Error('Fragment not found');
  }
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    throw new Error('Fragment owner mismatch');
  }

  const updatedFragment = { 
    ...fragment, 
    size: data.length,
    updated: new Date().toISOString()
  };
  await writeFragment(updatedFragment);

  logger.info({ ownerId, id, size: data.length }, 'Fragment data written to S3');
  return updatedFragment;
}

async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  if (!expand) {
    params.ProjectionExpression = 'id,created,updated';
  }

  const command = new QueryCommand(params);
  try {
    const data = await ddbDocClient.send(command);
    const items = data?.Items || [];
    logger.debug({ ownerId, count: items.length, expand }, 'Fragments listed from DynamoDB');
    return items;
  } catch (err) {
    logger.error({ err, params }, 'error getting all fragments for user from DynamoDB');
    throw err;
  }
}

async function deleteFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Deleting fragment from DynamoDB and S3');
  
  const fragment = await readFragment(ownerId, id);
  
  if (!fragment) {
    logger.debug({ ownerId, id }, 'Fragment not found in DynamoDB');
    return false;
  }
  
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    return false;
  }
  
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const s3Command = new DeleteObjectCommand(s3Params);
  try {
    await s3Client.send(s3Command);
    logger.debug({ ownerId, id }, 'Fragment data deleted from S3');
  } catch (err) {
    const { Bucket, Key } = s3Params;
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
  }
  
  const ddbParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  const ddbCommand = new DeleteCommand(ddbParams);
  try {
    await ddbDocClient.send(ddbCommand);
    logger.info({ ownerId, id }, 'Fragment deleted from DynamoDB and S3');
    return true;
  } catch (err) {
    logger.error({ err, params: ddbParams }, 'Error deleting fragment from DynamoDB');
    throw err;
  }
}

module.exports = {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
};
