// src/routes/api/get-by-id.js

const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const converter = require('../../converter');

/**
 * Get a specific fragment by ID
 * GET /v1/fragments/:id or GET /v1/fragments/:id.ext
 */
module.exports = async (req, res) => {
  try {
    let { id } = req.params;
    const ownerId = req.user;

    // Parse extension from ID if present (e.g., "fragment-id.html" -> id="fragment-id", ext=".html")
    let requestedExtension = null;
    const lastDotIndex = id.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex < id.length - 1) {
      // Extract extension and actual ID
      requestedExtension = id.substring(lastDotIndex);
      id = id.substring(0, lastDotIndex);
    }

    logger.debug({ id, ownerId, requestedExtension }, 'Getting fragment by ID');

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

    logger.debug({ id, ownerId, type: fragment.type, requestedExtension }, 'Fragment found');

    // Get fragment data
    let data = await fragment.getData();
    
    if (!data) {
      logger.warn({ id, ownerId }, 'Fragment data not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment data not found'));
    }

    let contentType = fragment.type;

    // Handle type conversion if extension is requested
    if (requestedExtension) {
      // Map extension to target MIME type
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
      
      // If the requested type matches the original type, skip conversion
      // This preserves the original image data without re-encoding
      if (fragment.type === targetType) {
        logger.debug({ id, ownerId, type: fragment.type }, 'Requested type matches original, skipping conversion');
        contentType = targetType;
      } else {
        // Check if conversion is supported
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
        
        // Perform conversion only when types differ
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

    // Set appropriate Content-Type header
    res.setHeader('Content-Type', contentType);
    
    // Set Content-Length header
    res.setHeader('Content-Length', data.length);

    logger.info({ 
      id, 
      ownerId, 
      type: contentType, 
      size: data.length,
      converted: !!requestedExtension
    }, 'Fragment data retrieved successfully');

    // Return the fragment data
    res.status(200).send(data);

  } catch (err) {
    logger.error({ err, id: req.params.id, user: req.user }, 'Error getting fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
