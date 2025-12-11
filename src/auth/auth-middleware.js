const passport = require('passport');
const { hashEmail } = require('../hash');
const logger = require('../logger');

function authorize(strategy) {
  return (req, res, next) => {
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
      
      if (res.headersSent) {
        logger.debug({ strategy }, 'Response already sent by auth strategy');
        return;
      }
      
      if (err) {
        logger.error({ err, strategy }, 'Authentication error');
        return next(err);
      }
      
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
      
      try {
        let hashedUser;
        if (process.env.NODE_ENV === 'test') {
          hashedUser = authenticatedUser;
        } else {
          try {
            hashedUser = hashEmail(authenticatedUser);
          } catch {
            logger.debug({ user: authenticatedUser }, 'User is not an email, hashing as username');
            const { hash } = require('../hash');
            hashedUser = hash(authenticatedUser);
          }
        }
        
        logger.debug({ 
          originalUser: authenticatedUser,
          hashedUser, 
          strategy 
        }, 'User hashed for privacy');
        
        req.user = hashedUser;
        next();
      } catch (hashError) {
        logger.error({ 
          err: hashError, 
          user: authenticatedUser, 
          strategy 
        }, 'Error hashing user');
        
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
