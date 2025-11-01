"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const logger_1 = require("../utils/logger");
class RedisService {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    async connect() {
        try {
            logger_1.logger.info('🔗 Redis connection simulated for development');
            this.isConnected = true;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to connect to Redis:', error);
            this.isConnected = false;
        }
    }
    async disconnect() {
        logger_1.logger.info('Redis connection closed');
    }
    isRedisConnected() {
        return this.isConnected;
    }
    async set(key, value, ttl) {
        logger_1.logger.debug(`Redis SET operation skipped for key: ${key}`);
    }
    async get(key) {
        logger_1.logger.debug(`Redis GET operation skipped for key: ${key}`);
        return null;
    }
    async del(key) {
        logger_1.logger.debug(`Redis DEL operation skipped for key: ${key}`);
    }
    async exists(key) {
        logger_1.logger.debug(`Redis EXISTS operation skipped for key: ${key}`);
        return false;
    }
    async setJSON(key, value, ttl) {
        logger_1.logger.debug(`Redis SETJSON operation skipped for key: ${key}`);
    }
    async getJSON(key) {
        logger_1.logger.debug(`Redis GETJSON operation skipped for key: ${key}`);
        return null;
    }
    async cacheResponse(key, data, ttl = 300) {
        logger_1.logger.debug(`Redis cache response skipped for key: ${key}`);
    }
    async getCachedResponse(key) {
        logger_1.logger.debug(`Redis get cached response skipped for key: ${key}`);
        return null;
    }
    async invalidateCache(pattern) {
        logger_1.logger.debug(`Redis invalidate cache skipped for pattern: ${pattern}`);
    }
}
exports.RedisService = RedisService;
exports.redisService = RedisService.getInstance();
exports.default = exports.redisService;
