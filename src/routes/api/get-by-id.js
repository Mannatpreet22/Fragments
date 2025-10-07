// src/routes/api/get-by-id.js

const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a specific fragment by ID
 * GET /v1/fragments/:id
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.debug({ id, ownerId }, 'Getting fragment by ID');

    // Check if user is authenticated
    if (!ownerId) {
      logger.warn('Unauthenticated request to get fragment');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    // Get fragment metadata
    const fragment = await Fragment.byId(ownerId, id);
    
    if (!fragment) {
      logger.warn({ id, ownerId }, 'Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    logger.debug({ id, ownerId, type: fragment.type }, 'Fragment found');

    // Get fragment data
    const data = await fragment.getData();
    
    if (!data) {
      logger.warn({ id, ownerId }, 'Fragment data not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment data not found'));
    }

    // Set appropriate Content-Type header
    res.setHeader('Content-Type', fragment.type);
    
    // Set Content-Length header
    res.setHeader('Content-Length', data.length);

    logger.info({ 
      id, 
      ownerId, 
      type: fragment.type, 
      size: data.length 
    }, 'Fragment data retrieved successfully');

    // Return the fragment data
    res.status(200).send(data);

  } catch (err) {
    logger.error({ err, id: req.params.id, user: req.user }, 'Error getting fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};