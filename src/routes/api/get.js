// src/routes/api/get.js

const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 * GET /v1/fragments?expand=1
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;

    // Check if expand query parameter is present
    const expand = req.query.expand === '1' || req.query.expand === 'true';

    logger.debug({ ownerId, expand }, 'Getting fragments for user');

    // Check if user is authenticated
    if (!ownerId) {
      logger.warn('Unauthenticated request to get fragments');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    // Get all fragments for the user, with optional expansion
    const fragments = await Fragment.byUser(ownerId, expand);

    logger.info({ ownerId, count: fragments.length, expand }, 'Fragments retrieved successfully');

    // Return success response with fragments array
    // When expand is false, fragments is an array of IDs (strings)
    // When expand is true, fragments is an array of fragment objects
    if (!expand) {
      // Return array of IDs
      res.status(200).json(createSuccessResponse({
        fragments: fragments.map(id => ({ id })),
      }));
    } else {
      // Return array of full fragment metadata objects
      res.status(200).json(createSuccessResponse({
        fragments: fragments.map(fragment => {
          // When expand is true, return full metadata (but not raw data)
          // The spec requires expanded metadata objects, not embedding raw data
          return {
            id: fragment.id,
            ownerId: fragment.ownerId,
            type: fragment.type,
            size: fragment.size,
            created: fragment.created,
            updated: fragment.updated,
          };
        }),
      }));
    }

  } catch (err) {
    logger.error({ err, user: req.user }, 'Error getting fragments');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
