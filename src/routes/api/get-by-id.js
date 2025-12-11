const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const converter = require('../../converter');

module.exports = async (req, res) => {
  try {
    let { id } = req.params;
    const ownerId = req.user;

    let requestedExtension = null;
    const lastDotIndex = id.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex < id.length - 1) {
      requestedExtension = id.substring(lastDotIndex);
      id = id.substring(0, lastDotIndex);
    }

    logger.debug({ id, ownerId, requestedExtension }, 'Getting fragment by ID');

    if (!ownerId) {
      logger.warn('Unauthenticated request to get fragment');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    const fragment = await Fragment.byId(ownerId, id);
    
    if (!fragment) {
      logger.warn({ id, ownerId }, 'Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    logger.debug({ id, ownerId, type: fragment.type, requestedExtension }, 'Fragment found');

    let data = await fragment.getData();
    
    if (!data) {
      logger.warn({ id, ownerId }, 'Fragment data not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment data not found'));
    }

    let contentType = fragment.type;

    if (requestedExtension) {
      const targetType = converter.extensionToMimeType(requestedExtension);
      
      if (!targetType) {
        logger.warn({ 
          id, 
          ownerId, 
          requestedExtension 
        }, 'Unknown file extension');
        return res.status(415).json(createErrorResponse(
          415, 
          `Unknown file extension: ${requestedExtension}`
        ));
      }
      
      if (fragment.type === targetType) {
        logger.debug({ id, ownerId, type: fragment.type }, 'Requested type matches original, skipping conversion');
        contentType = targetType;
      } else {
        if (!converter.canConvert(fragment.type, targetType)) {
          logger.warn({ 
            id, 
            ownerId, 
            fragmentType: fragment.type, 
            targetType,
            requestedExtension 
          }, 'Unsupported type conversion');
          return res.status(415).json(createErrorResponse(
            415, 
            `Conversion from ${fragment.type} to ${targetType} is not supported`
          ));
        }
        
        try {
          logger.debug({ id, ownerId, fromType: fragment.type, toType: targetType }, 'Converting fragment');
          data = await converter.convert(data, fragment.type, targetType);
          contentType = targetType;
          logger.info({ id, ownerId, fromType: fragment.type, toType: targetType }, 'Fragment converted successfully');
        } catch (err) {
          logger.error({ err, id, ownerId, fromType: fragment.type, toType: targetType }, 'Conversion failed');
          return res.status(415).json(createErrorResponse(
            415, 
            `Conversion failed: ${err.message}`
          ));
        }
      }
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', data.length);

    logger.info({ 
      id, 
      ownerId, 
      type: contentType, 
      size: data.length,
      converted: !!requestedExtension
    }, 'Fragment data retrieved successfully');

    res.status(200).send(data);

  } catch (err) {
    logger.error({ err, id: req.params.id, user: req.user }, 'Error getting fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
