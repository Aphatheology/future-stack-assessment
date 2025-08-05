import app from './app';
import config from './config/env';
import logger from './config/logger';

const startServer = async () => {
  try {
    const server = app.listen(config.port, () => {
      logger.info(`Server running and listening on port ${config.port}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

startServer();