import dotenv from 'dotenv';
import App from './app';
import { initializeDatabase } from './database/connection';
import { logger } from './utils/logger';
import { redisService } from './config/redis.config';

// Load environment variables
dotenv.config();

class Server {
  private app: App;
  private port: number;

  constructor() {
    this.app = new App();
    this.port = parseInt(process.env.PORT || '3000');
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection
      logger.info('🔌 Initializing database connection...');
      await initializeDatabase();

      // Initialize Redis connection (optional)
      logger.info('🔴 Initializing Redis connection...');
      await redisService.connect().catch(error => {
        logger.warn('⚠️ Redis connection failed, continuing without caching:', error.message);
      });

      // Start server
      const server = this.app.getApp().listen(this.port, () => {
        logger.info('🚀 Server started successfully', {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          processId: process.pid,
        });

        // Development URLs
        if (process.env.NODE_ENV !== 'production') {
          console.log('\n📡 Server URLs:');
          console.log(`   🌐 Local:      http://localhost:${this.port}`);
          console.log(`   💚 Health:     http://localhost:${this.port}/api/health`);
          console.log(`   📚 API Info:   http://localhost:${this.port}/`);
          console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        }
      });

      // Handle server errors
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        const bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

        switch (error.code) {
          case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
          case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
            break;
          default:
            throw error;
        }
      });

      // Graceful shutdown
      const gracefulShutdown = async (signal: string) => {
        logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);

        // Close server
        server.close(async () => {
          logger.info('📡 HTTP server closed');

          try {
            // Close database connection
            await require('mongoose').connection.close();
            logger.info('🗄️ Database connection closed');

            // Close Redis connection
            await redisService.disconnect();
            logger.info('🔴 Redis connection closed');

            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during graceful shutdown:', error);
            process.exit(1);
          }
        });

        // Force close after 30 seconds
        setTimeout(() => {
          logger.error('⏰ Graceful shutdown timeout, forcing exit');
          process.exit(1);
        }, 30000);
      };

      // Register shutdown handlers
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      // Handle unhandled rejections
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', { promise, reason });
        // Don't exit the process for unhandled rejections in production
        if (process.env.NODE_ENV === 'development') {
          process.exit(1);
        }
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        process.exit(1);
      });

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start().catch((error) => {
  logger.error('❌ Server startup failed:', error);
  process.exit(1);
});