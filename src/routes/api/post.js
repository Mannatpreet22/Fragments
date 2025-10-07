// src/routes/api/post.js

const contentType = require('content-type');
const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Create a new fragment
 * POST /v1/fragments
 */
module.exports = async (req, res) => {
  try {
    logger.debug({ 
      user: req.user, 
      contentType: req.headers['content-type'],
      bodySize: req.body ? req.body.length : 0 
    }, 'Creating new fragment');

    // Check if user is authenticated
    if (!req.user) {
      logger.warn('Unauthenticated request to create fragment');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    // Parse Content-Type header
    let parsedContentType;
    try {
      parsedContentType = contentType.parse(req);
    } catch (err) {
      logger.warn({ err, contentType: req.headers['content-type'] }, 'Invalid Content-Type header');
      return res.status(400).json(createErrorResponse(400, 'Invalid Content-Type header'));
    }

    const { type } = parsedContentType;

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

    // Create new fragment
    const fragment = new Fragment({
      ownerId: req.user,
      type,
      size: req.body.length,
      data: req.body,
    });

    // Save fragment to database
    await fragment.save();

    logger.info({ 
      id: fragment.id, 
      ownerId: fragment.ownerId, 
      type: fragment.type, 
      size: fragment.size 
    }, 'Fragment created successfully');

    // Create Location header URL
    const apiUrl = process.env.API_URL;
    let locationUrl;
    
    if (apiUrl) {
      locationUrl = `${apiUrl}/v1/fragments/${fragment.id}`;
    } else {
      // Use req.headers.host to construct URL dynamically
      const protocol = req.secure ? 'https' : 'http';
      const host = req.headers.host;
      locationUrl = `${protocol}://${host}/v1/fragments/${fragment.id}`;
    }

    // Set Location header
    res.setHeader('Location', locationUrl);

    // Return success response with fragment metadata
    res.status(201).json(createSuccessResponse({
      fragment: fragment.toJSON(),
    }));

  } catch (err) {
    logger.error({ err, user: req.user }, 'Error creating fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};