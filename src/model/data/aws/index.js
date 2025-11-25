// src/model/data/aws/index.js

// XXX: temporary use of memory-db until we add DynamoDB
const MemoryDB = require('../memory/memory-db');
const logger = require('../../../logger');
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Read a fragment by ID
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<Object|null>} The fragment data or null if not found
 */
async function readFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Reading fragment from memory DB');
  
  const fragment = MemoryDB.get(id);
  
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
  const storedFragment = MemoryDB.set(id, fragmentData);
  
  logger.info({ id, ownerId: fragmentData.ownerId }, 'Fragment written to memory DB');
  return { id, ...storedFragment };
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

  // Verify fragment exists in memory and return it
  const fragment = MemoryDB.get(id);
  if (!fragment) {
    logger.warn({ ownerId, id }, 'Fragment not found in memory, but data uploaded to S3');
    throw new Error('Fragment not found');
  }
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    throw new Error('Fragment owner mismatch');
  }

  logger.info({ ownerId, id, size: data.length }, 'Fragment data written to S3');
  return { id, ...fragment, size: data.length };
}

/**
 * Get all fragments for an owner
 * @param {string} ownerId - The owner ID
 * @returns {Promise<Array>} Array of fragment objects
 */
async function listFragments(ownerId) {
  logger.debug({ ownerId }, 'Listing fragments for owner from memory DB');
  
  const fragments = MemoryDB.getByOwner(ownerId);
  
  logger.debug({ ownerId, count: fragments.length }, 'Fragments listed from memory DB');
  return fragments;
}

/**
 * Delete a fragment
 * Deletes a fragment's data from S3 and metadata from memory DB
 * @param {string} ownerId - The owner ID
 * @param {string} id - The fragment ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Deleting fragment from memory DB and S3');
  
  const fragment = MemoryDB.get(id);
  
  if (!fragment) {
    logger.debug({ ownerId, id }, 'Fragment not found in memory DB');
    return false;
  }
  
  if (fragment.ownerId !== ownerId) {
    logger.warn({ ownerId, id, fragmentOwnerId: fragment.ownerId }, 'Fragment owner mismatch');
    return false;
  }
  
  // Delete from S3 first
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a DELETE Object command to send to S3
  const command = new DeleteObjectCommand(params);
  try {
    // Use our client to send the command
    await s3Client.send(command);
    logger.debug({ ownerId, id }, 'Fragment data deleted from S3');
  } catch (err) {
    // Log the error but continue to delete from memory
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
    // Don't throw - we'll still try to delete from memory
  }
  
  // Delete from memory DB
  const deleted = MemoryDB.delete(id);
  
  if (deleted) {
    logger.info({ ownerId, id }, 'Fragment deleted from memory DB and S3');
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
