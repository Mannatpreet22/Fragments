// src/routes/api/get.js

const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 * GET /v1/fragments
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;

    logger.debug({ ownerId }, 'Getting fragments for user');

    // Check if user is authenticated
    if (!ownerId) {
      logger.warn('Unauthenticated request to get fragments');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    // Get all fragments for the user
    const fragments = await Fragment.byUser(ownerId);

    logger.info({ ownerId, count: fragments.length }, 'Fragments retrieved successfully');

    // Return success response with fragments array
    res.status(200).json(createSuccessResponse({
      fragments: fragments.map(fragment => fragment.toJSON()),
    }));

  } catch (err) {
    logger.error({ err, user: req.user }, 'Error getting fragments');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
