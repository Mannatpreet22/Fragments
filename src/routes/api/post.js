const contentType = require('content-type');
const Fragment = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    logger.debug({ 
      user: req.user, 
      contentType: req.headers['content-type'],
      bodySize: req.body ? req.body.length : 0 
    }, 'Creating new fragment');

    if (!req.user) {
      logger.warn('Unauthenticated request to create fragment');
      return res.status(401).json(createErrorResponse(401, 'Authentication required'));
    }

    let parsedContentType;
    let type;
    
    try {
      parsedContentType = contentType.parse(req);
      type = parsedContentType.type;
    } catch (err) {
      logger.warn({ err, contentType: req.headers['content-type'] }, 'Invalid or missing Content-Type header');
      return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type: Content-Type header is missing or invalid'));
    }

    if (!Fragment.isSupportedType(type)) {
      logger.warn({ type }, 'Unsupported content type');
      return res.status(415).json(createErrorResponse(415, `Unsupported content type: ${type}`));
    }

    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Request body was not parsed by raw body parser');
      return res.status(400).json(createErrorResponse(400, 'Invalid request body'));
    }

    if (req.body.length === 0) {
      logger.warn('Empty request body');
      return res.status(400).json(createErrorResponse(400, 'Request body cannot be empty'));
    }

    const fragment = new Fragment({
      ownerId: req.user,
      type,
      size: req.body.length,
      data: req.body,
    });

    await fragment.save();

    logger.info({ 
      id: fragment.id, 
      ownerId: fragment.ownerId, 
      type: fragment.type, 
      size: fragment.size 
    }, 'Fragment created successfully');

    const apiUrl = process.env.API_URL;
    let locationUrl;
    
    if (apiUrl) {
      locationUrl = `${apiUrl}/v1/fragments/${fragment.id}`;
    } else {
      const protocol = req.secure ? 'https' : 'http';
      const host = req.headers.host;
      locationUrl = `${protocol}://${host}/v1/fragments/${fragment.id}`;
    }

    res.setHeader('Location', locationUrl);

    res.status(201).json(createSuccessResponse({
      fragment: fragment.toJSON(),
    }));

  } catch (err) {
    logger.error({ err, user: req.user }, 'Error creating fragment');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
