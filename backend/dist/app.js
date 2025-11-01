"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
require("express-async-errors");
const app_config_1 = require("./config/app.config");
const logger_1 = require("./utils/logger");
const ApiResponse_1 = require("./utils/ApiResponse");
const logger_2 = require("./utils/logger");
const routes_1 = __importDefault(require("./routes"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddlewares() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        }));
        this.app.use((0, cors_1.default)(app_config_1.appConfig.cors));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((0, express_mongo_sanitize_1.default)());
        if (app_config_1.appConfig.development.enableDebug) {
            this.app.use((0, morgan_1.default)('combined', { stream: logger_1.httpLogStream }));
        }
        const limiter = (0, express_rate_limit_1.default)(app_config_1.appConfig.rateLimit);
        this.app.use('/api', limiter);
        this.app.set('trust proxy', 1);
    }
    initializeRoutes() {
        this.app.get('/api/health', (req, res) => {
            ApiResponse_1.ApiResponse.success(res, 'Health check successful', {
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: app_config_1.appConfig.nodeEnv,
                version: '1.0.0',
            });
        });
        this.app.get('/', (req, res) => {
            ApiResponse_1.ApiResponse.success(res, 'API Information', {
                name: 'Laboratory Information System API',
                version: '1.0.0',
                description: 'Express.js + MongoDB backend for LIS',
                status: 'Running',
                endpoints: {
                    health: '/api/health',
                    auth: `${app_config_1.appConfig.apiPrefix}/auth`,
                    patients: `${app_config_1.appConfig.apiPrefix}/patients`,
                    tests: `${app_config_1.appConfig.apiPrefix}/tests`,
                    orders: `${app_config_1.appConfig.apiPrefix}/orders`,
                    results: `${app_config_1.appConfig.apiPrefix}/results`,
                    reports: `${app_config_1.appConfig.apiPrefix}/reports`,
                },
                documentation: app_config_1.appConfig.development.enableApiDocs ?
                    `http://localhost:${app_config_1.appConfig.port}/api/docs` : 'Not available in production',
            });
        });
        this.app.use(app_config_1.appConfig.apiPrefix, routes_1.default);
        console.log('📋 API routes initialized');
    }
    initializeErrorHandling() {
        this.app.use('*', (req, res) => {
            ApiResponse_1.ApiResponse.notFound(res, 'Route not found');
        });
        this.app.use((error, req, res, next) => {
            logger_2.logger.error('Unhandled error:', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            if (error.name === 'ValidationError') {
                return ApiResponse_1.ApiResponse.badRequest(res, 'Validation failed', error.details);
            }
            if (error.name === 'CastError') {
                return ApiResponse_1.ApiResponse.badRequest(res, 'Invalid ID format');
            }
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                return ApiResponse_1.ApiResponse.conflict(res, `${field} already exists`);
            }
            if (error.status === 401) {
                return ApiResponse_1.ApiResponse.unauthorized(res, error.message);
            }
            if (error.status === 403) {
                return ApiResponse_1.ApiResponse.forbidden(res, error.message);
            }
            if (error.status === 404) {
                return ApiResponse_1.ApiResponse.notFound(res, error.message);
            }
            return ApiResponse_1.ApiResponse.serverError(res, app_config_1.appConfig.development.enableDebug ? error.message : 'Internal server error');
        });
    }
    getApp() {
        return this.app;
    }
}
exports.App = App;
exports.default = App;
