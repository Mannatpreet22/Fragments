const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.debug({ id, ownerId }, 'Getting fragment info by ID');

    if (!ownerId) {
      logger.warn('Unauthenticated request to get fragment info');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    const fragment = await Fragment.byId(ownerId, id);
    
    if (!fragment) {
      logger.warn({ id, ownerId }, 'Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    logger.info({ 
      id, 
      ownerId, 
      type: fragment.type,
      size: fragment.size 
    }, 'Fragment info retrieved successfully');

    res.status(200).json(createSuccessResponse({
      fragment: fragment.toJSON(),
    }));

  } catch (err) {
    logger.error({ err, id: req.params.id, user: req.user }, 'Error getting fragment info');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};

