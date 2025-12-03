// src/model/data/aws/index.js

const logger = require('../../../logger');
const s3Client = require('./s3Client');
const ddbDocClient = require('./ddbDocClient');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * Read a fragment by ID
 * Reads a fragment from DynamoDB. Returns a Promise<fragment|undefined>
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<Object|null>} The fragment data or null if not found
 */
async function readFragment(ownerId, id) {
  // Configure our GET params, with the name of the table and key (partition key + sort key)
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  // Create a GET command to send to DynamoDB
  const command = new GetCommand(params);
  try {
    // Wait for the data to come back from AWS
    const data = await ddbDocClient.send(command);
    // We may or may not get back any data (e.g., no item found for the given key).
    // If we get back an item (fragment), we'll return it.  Otherwise we'll return `undefined`.
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

/**
 * Write a fragment
 * Writes a fragment to DynamoDB. Returns a Promise.
 * @param {Object} fragment - The fragment data
 * @returns {Promise<Object>} The stored fragment data
 */
async function writeFragment(fragment) {
  // Configure our PUT params, with the name of the table and item (attributes and keys)
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  // Create a PUT command to send to DynamoDB
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

/**
 * Convert a stream of data into a Buffer, by collecting
 * chunks of data until finished, then assembling them together.
 * We wrap the whole thing in a Promise so it's easier to consume.
 */
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    // As the data streams in, we'll collect it into an array.
    const chunks = [];

    // Streams have events that we can listen for and run
    // code.  We need to know when new `data` is available,
    // if there's an `error`, and when we're at the `end`
    // of the stream.

    // When there's data, add the chunk to our chunks list
    stream.on('data', (chunk) => chunks.push(chunk));

    // When there's an error, reject the Promise
    stream.on('error', reject);

    // When the stream is done, resolve with a new Buffer of our chunks
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

/**
 * Read fragment data (binary content)
 * Reads a fragment's data from S3 and returns (Promise<Buffer>)
 * https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#getting-a-file-from-an-amazon-s3-bucket
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<Buffer|null>} The fragment data buffer or null if not found
 */
async function readFragmentData(ownerId, id) {
  // Create the GET API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a GET Object command to send to S3
  const command = new GetObjectCommand(params);
  try {
    // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(command);
    // Convert the ReadableStream to a Buffer
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    // If the object doesn't exist, return null (matching memory implementation)
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      logger.debug({ ownerId, id, Bucket, Key }, 'Fragment data not found in S3');
      return null;
    }
    // For other errors, log and throw
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

/**
 * Write fragment data (binary content)
 * Writes a fragment's data to an S3 Object in a Bucket
 * https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#upload-an-existing-object-to-an-amazon-s3-bucket
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @param {Buffer} data - The fragment data buffer
 * @returns {Promise<Object>} The updated fragment data
 */
async function writeFragmentData(ownerId, id, data) {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  // Log before attempting S3 upload for debugging
  logger.info({ 
    Bucket: params.Bucket, 
    Key: params.Key, 
    ownerId, 
    id, 
    dataSize: data.length,
    hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
    hasRegion: !!process.env.AWS_REGION
  }, 'Attempting to write fragment data to S3');

  // Create a PUT Object command to send to S3
  const command = new PutObjectCommand(params);
  try {
    // Use our client to send the command
    await s3Client.send(command);
    logger.info({ Bucket: params.Bucket, Key: params.Key }, 'Successfully uploaded fragment data to S3');
  } catch (err) {
    // If anything goes wrong, log enough info that we can debug
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

  // Verify fragment exists in DynamoDB and return it
  const fragment = await readFragment(ownerId, id);
  if (!fragment) {
    logger.warn({ ownerId, id }, 'Fragment not found in DynamoDB, but data uploaded to S3');
    throw new Error('Fragment not found');
  }
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    throw new Error('Fragment owner mismatch');
  }

  // Update the fragment size in DynamoDB
  const updatedFragment = { ...fragment, size: data.length };
  await writeFragment(updatedFragment);

  logger.info({ ownerId, id, size: data.length }, 'Fragment data written to S3');
  return updatedFragment;
}

/**
 * Get all fragments for an owner
 * Get a list of fragments, either ids-only, or full Objects, for the given user.
 * Returns a Promise<Array<Fragment>|Array<string>|undefined>
 * @param {string} ownerId - The owner ID
 * @param {boolean} expand - Whether to return full objects or just IDs
 * @returns {Promise<Array>} Array of fragment objects or IDs
 */
async function listFragments(ownerId, expand = false) {
  // Configure our QUERY params, with the name of the table and the query expression
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    // Specify that we want to get all items where the ownerId is equal to the
    // `:ownerId` that we'll define below in the ExpressionAttributeValues.
    KeyConditionExpression: 'ownerId = :ownerId',
    // Use the `ownerId` value to do the query
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  // Limit to only `id` if we aren't supposed to expand. Without doing this
  // we'll get back every attribute.  The projection expression defines a list
  // of attributes to return, see:
  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ProjectionExpressions.html
  if (!expand) {
    params.ProjectionExpression = 'id';
  }

  // Create a QUERY command to send to DynamoDB
  const command = new QueryCommand(params);
  try {
    // Wait for the data to come back from AWS
    const data = await ddbDocClient.send(command);
    // If we haven't expanded to include all attributes, remap this array from
    // [ {"id":"b9e7a264-630f-436d-a785-27f30233faea"}, {"id":"dad25b07-8cd6-498b-9aaf-46d358ea97fe"} ,... ] to
    // [ "b9e7a264-630f-436d-a785-27f30233faea", "dad25b07-8cd6-498b-9aaf-46d358ea97fe", ... ]
    const items = data?.Items || [];
    logger.debug({ ownerId, count: items.length, expand }, 'Fragments listed from DynamoDB');
    return !expand ? items.map((item) => item.id) : items;
  } catch (err) {
    logger.error({ err, params }, 'error getting all fragments for user from DynamoDB');
    throw err;
  }
}

/**
 * Delete a fragment
 * Deletes a fragment's data from S3 and metadata from DynamoDB
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Deleting fragment from DynamoDB and S3');
  
  // First check if fragment exists
  const fragment = await readFragment(ownerId, id);
  
  if (!fragment) {
    logger.debug({ ownerId, id }, 'Fragment not found in DynamoDB');
    return false;
  }
  
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    return false;
  }
  
  // Delete from S3 first
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a DELETE Object command to send to S3
  const s3Command = new DeleteObjectCommand(s3Params);
  try {
    // Use our client to send the command
    await s3Client.send(s3Command);
    logger.debug({ ownerId, id }, 'Fragment data deleted from S3');
  } catch (err) {
    // Log the error but continue to delete from DynamoDB
    const { Bucket, Key } = s3Params;
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
    // Don't throw - we'll still try to delete from DynamoDB
  }
  
  // Delete from DynamoDB
  const ddbParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  // Create a DELETE command to send to DynamoDB
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
