const auth = require('http-auth');
const authPassport = require('http-auth-passport');
const logger = require('../logger');
const authorize = require('./auth-middleware');

if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

logger.info('Using HTTP Basic Auth for auth');

module.exports.strategy = () => {
  const strategy = authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );
  if (!strategy.name) {
    strategy.name = 'http';
  }
  return strategy;
};

module.exports.authenticate = () => authorize('http');


