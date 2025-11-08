// src/routes/api/get-by-id.js

const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');

// Initialize markdown-it for converting Markdown to HTML
const md = new MarkdownIt();

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
      // Currently only support Markdown (.md) to HTML (.html) conversion
      if (fragment.type === 'text/markdown' && requestedExtension === '.html') {
        logger.debug({ id, ownerId }, 'Converting Markdown to HTML');
        const markdownText = data.toString('utf-8');
        const htmlContent = md.render(markdownText);
        data = Buffer.from(htmlContent, 'utf-8');
        contentType = 'text/html';
        logger.info({ id, ownerId }, 'Markdown converted to HTML successfully');
      } else {
        // Unsupported conversion
        logger.warn({ 
          id, 
          ownerId, 
          fragmentType: fragment.type, 
          requestedExtension 
        }, 'Unsupported type conversion');
        return res.status(415).json(createErrorResponse(
          415, 
          `Conversion from ${fragment.type} to ${requestedExtension} is not supported`
        ));
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
