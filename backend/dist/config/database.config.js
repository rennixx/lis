"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDatabaseConnected = exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectDatabase = async () => {
    try {
        let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lis_db';
        const dbName = process.env.MONGODB_DB_NAME || 'lis_db';
        const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10');
        if (process.env.NODE_ENV !== 'production') {
            const url = new URL(mongoUri);
            url.searchParams.delete('replicaSet');
            mongoUri = url.toString();
        }
        const options = {
            maxPoolSize,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            autoIndex: process.env.NODE_ENV === 'development',
            connectTimeoutMS: 10000,
        };
        await mongoose_1.default.connect(mongoUri, options);
        logger_1.logger.debug('MongoDB connection name:', mongoose_1.default.connection.name);
        mongoose_1.default.connection.on('connected', () => {
            logger_1.logger.info('✅ Connected to MongoDB', {
                uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'),
                database: dbName,
                maxPoolSize,
            });
        });
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.logger.error('❌ MongoDB connection error:', error.message);
            setTimeout(() => {
                logger_1.logger.info('🔄 Attempting to reconnect to MongoDB...');
                (0, exports.connectDatabase)().catch(err => {
                    logger_1.logger.error('MongoDB reconnection failed:', err.message);
                });
            }, 5000);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('⚠️ MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('✅ MongoDB reconnected successfully');
        });
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            logger_1.logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
        if (process.env.NODE_ENV === 'development') {
            mongoose_1.default.set('debug', (collectionName, method, query, doc) => {
                logger_1.logger.debug('MongoDB Query:', { collectionName, method, query, doc });
            });
        }
        logger_1.logger.info('MongoDB connection established successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('MongoDB connection closed successfully');
    }
    catch (error) {
        logger_1.logger.error('Error closing MongoDB connection:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
const isDatabaseConnected = () => {
    return mongoose_1.default.connection.readyState === 1;
};
exports.isDatabaseConnected = isDatabaseConnected;
