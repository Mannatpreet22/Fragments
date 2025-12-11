const express = require('express');
const contentType = require('content-type');
const Fragment = require('../../model/fragment');
const logger = require('../../logger');

const router = express.Router();

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      } catch (err) {
        logger.debug({ err, contentType: req.headers['content-type'] }, 'Could not parse content type');
        return false;
      }
    },
  });
router.get('/fragments', require('./get'));
router.post('/fragments', rawBody(), require('./post'));
router.get('/fragments/:id/info', require('./get-info'));
router.get('/fragments/:id', require('./get-by-id'));
router.put('/fragments/:id', rawBody(), require('./put'));
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
