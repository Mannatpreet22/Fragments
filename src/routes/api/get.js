const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const expand = req.query.expand === '1' || req.query.expand === 'true';

    logger.debug({ ownerId, expand }, 'Getting fragments for user');

    if (!ownerId) {
      logger.warn('Unauthenticated request to get fragments');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    const fragments = await Fragment.byUser(ownerId, expand);

    logger.info({ ownerId, count: fragments.length, expand }, 'Fragments retrieved successfully');

    if (!expand) {
      res.status(200).json(createSuccessResponse({
        fragments: fragments.map(fragment => ({
          id: fragment.id,
          created: fragment.created,
          updated: fragment.updated,
        })),
      }));
    } else {
      res.status(200).json(createSuccessResponse({
        fragments: fragments.map(fragment => ({
          id: fragment.id,
          ownerId: fragment.ownerId,
          type: fragment.type,
          size: fragment.size,
          created: fragment.created,
          updated: fragment.updated,
        })),
      }));
    }

  } catch (err) {
    logger.error({ err, user: req.user }, 'Error getting fragments');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
