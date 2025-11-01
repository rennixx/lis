"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const connection_1 = require("./database/connection");
const logger_1 = require("./utils/logger");
const redis_config_1 = require("./config/redis.config");
dotenv_1.default.config();
class Server {
    constructor() {
        this.app = new app_1.default();
        this.port = parseInt(process.env.PORT || '3000');
    }
    async start() {
        try {
            logger_1.logger.info('🔌 Initializing database connection...');
            await (0, connection_1.initializeDatabase)();
            logger_1.logger.info('🔴 Initializing Redis connection...');
            await redis_config_1.redisService.connect().catch(error => {
                logger_1.logger.warn('⚠️ Redis connection failed, continuing without caching:', error.message);
            });
            const server = this.app.getApp().listen(this.port, () => {
                logger_1.logger.info('🚀 Server started successfully', {
                    port: this.port,
                    environment: process.env.NODE_ENV || 'development',
                    processId: process.pid,
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.log('\n📡 Server URLs:');
                    console.log(`   🌐 Local:      http://localhost:${this.port}`);
                    console.log(`   💚 Health:     http://localhost:${this.port}/api/health`);
                    console.log(`   📚 API Info:   http://localhost:${this.port}/`);
                    console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
                }
            });
            server.on('error', (error) => {
                if (error.syscall !== 'listen') {
                    throw error;
                }
                const bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;
                switch (error.code) {
                    case 'EACCES':
                        logger_1.logger.error(`${bind} requires elevated privileges`);
                        process.exit(1);
                        break;
                    case 'EADDRINUSE':
                        logger_1.logger.error(`${bind} is already in use`);
                        process.exit(1);
                        break;
                    default:
                        throw error;
                }
            });
            const gracefulShutdown = async (signal) => {
                logger_1.logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);
                server.close(async () => {
                    logger_1.logger.info('📡 HTTP server closed');
                    try {
                        await require('mongoose').connection.close();
                        logger_1.logger.info('🗄️ Database connection closed');
                        await redis_config_1.redisService.disconnect();
                        logger_1.logger.info('🔴 Redis connection closed');
                        logger_1.logger.info('✅ Graceful shutdown completed');
                        process.exit(0);
                    }
                    catch (error) {
                        logger_1.logger.error('❌ Error during graceful shutdown:', error);
                        process.exit(1);
                    }
                });
                setTimeout(() => {
                    logger_1.logger.error('⏰ Graceful shutdown timeout, forcing exit');
                    process.exit(1);
                }, 30000);
            };
            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));
            process.on('unhandledRejection', (reason, promise) => {
                logger_1.logger.error('Unhandled Rejection at:', { promise, reason });
                if (process.env.NODE_ENV === 'development') {
                    process.exit(1);
                }
            });
            process.on('uncaughtException', (error) => {
                logger_1.logger.error('Uncaught Exception:', error);
                process.exit(1);
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
}
const server = new Server();
server.start().catch((error) => {
    logger_1.logger.error('❌ Server startup failed:', error);
    process.exit(1);
});
