"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
exports.appConfig = {
    port: parseInt(process.env.PORT || '3000'),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    nodeEnv: process.env.NODE_ENV || 'development',
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
        credentials: process.env.CORS_CREDENTIALS === 'true',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: {
            success: false,
            message: 'Too many requests, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
        uploadPath: process.env.UPLOAD_PATH || './uploads',
    },
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
        from: process.env.SMTP_FROM || 'noreply@lis.com',
    },
    pagination: {
        defaultLimit: 10,
        maxLimit: 100,
    },
    response: {
        successMessages: {
            created: 'Resource created successfully',
            updated: 'Resource updated successfully',
            deleted: 'Resource deleted successfully',
            retrieved: 'Data retrieved successfully',
        },
        errorMessages: {
            notFound: 'Resource not found',
            unauthorized: 'Unauthorized access',
            forbidden: 'Access forbidden',
            validation: 'Validation failed',
            serverError: 'Internal server error',
        },
    },
    development: {
        enableDebug: process.env.NODE_ENV === 'development',
        enableApiDocs: process.env.NODE_ENV !== 'production',
        enableCors: process.env.NODE_ENV === 'development',
    },
};
exports.default = exports.appConfig;
