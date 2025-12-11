const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.debug({ id, ownerId }, 'Deleting fragment');

    if (!ownerId) {
      logger.warn('Unauthenticated request to delete fragment');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      logger.warn({ id, ownerId }, 'Fragment not found or access denied');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    const deleted = await Fragment.delete(ownerId, id);
    
    if (!deleted) {
      logger.warn({ id, ownerId }, 'Fragment deletion failed');
      return res.status(500).json(createErrorResponse(500, 'Failed to delete fragment'));
    }

    logger.info({ id, ownerId }, 'Fragment deleted successfully');

    res.status(200).json(createSuccessResponse({
      message: 'Fragment deleted successfully'
    }));

  } catch (err) {
    logger.error({ err, user: req.user, id: req.params.id }, 'Error deleting fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
