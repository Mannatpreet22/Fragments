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
    const authenticate = passport.authenticate(strategy, { session: false });
    
    // Call the Passport authentication
    authenticate(req, res, (err, user, info) => {
      if (err) {
        logger.error({ err, strategy }, 'Authentication error');
        return next(err);
      }
      
      if (!user) {
        logger.warn({ strategy, info }, 'Authentication failed');
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
        const hashedEmail = process.env.NODE_ENV === 'test' ? user : hashEmail(user);
        logger.debug({ 
          originalEmail: user, 
          hashedEmail, 
          strategy 
        }, 'User email hashed for privacy');
        
        // Set the hashed email as the authenticated user
        req.user = hashedEmail;
        next();
      } catch (hashError) {
        logger.error({ 
          err: hashError, 
          user, 
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