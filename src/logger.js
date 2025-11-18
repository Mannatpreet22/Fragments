const options = { level: process.env.LOG_LEVEL || 'info' };

// If we're doing `debug` logging, make the logs easier to read
if (options.level === 'debug') {
  // https://github.com/pinojs/pino-pretty
  // Use child process transport for better compatibility with --watch mode
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
  };
} else {
  // For info level and above, ensure logs are visible
  options.prettyPrint = false;
}

// https://getpino.io/#/docs/api?id=logger
const logger = require('pino')(options);

// Ensure logs are flushed immediately (important for --watch mode)
if (options.level === 'debug') {
  logger.info('Logger initialized with debug level');
}

module.exports = logger;
