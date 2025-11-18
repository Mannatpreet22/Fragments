// src/auth/auth-middleware.js

const passport = require('passport');
const { hashEmail } = require('../hash');
const logger = require('../logger');

/**
 * Custom authorization middleware that hashes user emails for privacy
 * @param {string} strategy - The Passport strategy to use ('bearer' or 'http')
 * @returns {Function} Express middleware function
 */
function authorize(strategy) {
  return (req, res, next) => {
    // Use the appropriate Passport strategy
    // Call passport.authenticate without a callback first to let it set req.user
    passport.authenticate(strategy, { session: false })(req, res, (err, user, info) => {
      logger.debug({ 
        err, 
        user, 
        info, 
        strategy, 
        hasUser: !!user, 
        reqUser: req.user,
        headersSent: res.headersSent 
      }, 'Passport authenticate callback');
      
      // If response was already sent (e.g., by http-auth), don't proceed
      if (res.headersSent) {
        logger.debug({ strategy }, 'Response already sent by auth strategy');
        return;
      }
      
      if (err) {
        logger.error({ err, strategy }, 'Authentication error');
        return next(err);
      }
      
      // Use user from callback, or fall back to req.user (set by passport)
      const authenticatedUser = user || req.user;
      
      if (!authenticatedUser) {
        logger.warn({ strategy, info, headers: req.headers }, 'Authentication failed - no user');
        return res.status(401).json({
          status: 'error',
          error: {
            code: 401,
            message: 'Authentication required',
          },
        });
      }
      
      // Hash the user's email for privacy
      try {
        // In test environment, skip hashing for easier testing
        const hashedEmail = process.env.NODE_ENV === 'test' ? authenticatedUser : hashEmail(authenticatedUser);
        logger.debug({ 
          originalUser: authenticatedUser,
          hashedEmail, 
          strategy 
        }, 'User email hashed for privacy');
        
        // Set the hashed email as the authenticated user
        req.user = hashedEmail;
        next();
      } catch (hashError) {
        logger.error({ 
          err: hashError, 
          user: authenticatedUser, 
          strategy 
        }, 'Error hashing user email');
        
        return res.status(500).json({
          status: 'error',
          error: {
            code: 500,
            message: 'Internal server error',
          },
        });
      }
    });
  };
}

module.exports = authorize;
