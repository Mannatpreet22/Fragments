// src/routes/api/put.js

const contentType = require('content-type');
const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Update an existing fragment
 * PUT /v1/fragments/:id
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.debug({ 
      id,
      user: ownerId, 
      contentType: req.headers['content-type'],
      bodySize: req.body ? req.body.length : 0 
    }, 'Updating fragment');

    // Check if user is authenticated
    if (!ownerId) {
      logger.warn('Unauthenticated request to update fragment');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    // Check if fragment exists and belongs to user
    const fragment = await Fragment.byId(ownerId, id);
    
    if (!fragment) {
      logger.warn({ id, ownerId }, 'Fragment not found or access denied');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Parse Content-Type header
    let parsedContentType;
    let type;
    
    try {
      parsedContentType = contentType.parse(req);
      type = parsedContentType.type;
    } catch (err) {
      logger.warn({ err, contentType: req.headers['content-type'] }, 'Invalid or missing Content-Type header');
      return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type: Content-Type header is missing or invalid'));
    }

    // Check if content type is supported
    if (!Fragment.isSupportedType(type)) {
      logger.warn({ type }, 'Unsupported content type');
      return res.status(415).json(createErrorResponse(415, `Unsupported content type: ${type}`));
    }

    // Check if body was parsed by raw body parser
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Request body was not parsed by raw body parser');
      return res.status(400).json(createErrorResponse(400, 'Invalid request body'));
    }

    // Check if body is not empty
    if (req.body.length === 0) {
      logger.warn('Empty request body');
      return res.status(400).json(createErrorResponse(400, 'Request body cannot be empty'));
    }

    // Update fragment
    await fragment.update(req.body, type);

    logger.info({ 
      id: fragment.id, 
      ownerId: fragment.ownerId, 
      type: fragment.type, 
      size: fragment.size 
    }, 'Fragment updated successfully');

    // Return success response with updated fragment metadata
    res.status(200).json(createSuccessResponse({
      fragment: fragment.toJSON(),
    }));

  } catch (err) {
    logger.error({ err, id: req.params.id, user: req.user }, 'Error updating fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};


