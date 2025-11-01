import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import 'express-async-errors';

import { appConfig } from './config/app.config';
import { httpLogStream } from './utils/logger';
import { ApiResponse } from './utils/ApiResponse';
import { logger } from './utils/logger';
import routes from './routes';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize all middlewares
   */
  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for API
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors(appConfig.cors));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Data sanitization
    this.app.use(mongoSanitize());

    // HTTP request logging
    if (appConfig.development.enableDebug) {
      this.app.use(morgan('combined', { stream: httpLogStream }));
    }

    // Rate limiting
    const limiter = rateLimit(appConfig.rateLimit);
    this.app.use('/api', limiter);

    // Trust proxy for IP detection
    this.app.set('trust proxy', 1);
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check route
    this.app.get('/api/health', (req, res) => {
      ApiResponse.success(res, 'Health check successful', {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: appConfig.nodeEnv,
        version: '1.0.0',
      });
    });

    // API info route
    this.app.get('/', (req, res) => {
      ApiResponse.success(res, 'API Information', {
        name: 'Laboratory Information System API',
        version: '1.0.0',
        description: 'Express.js + MongoDB backend for LIS',
        status: 'Running',
        endpoints: {
          health: '/api/health',
          auth: `${appConfig.apiPrefix}/auth`,
          patients: `${appConfig.apiPrefix}/patients`,
          tests: `${appConfig.apiPrefix}/tests`,
          orders: `${appConfig.apiPrefix}/orders`,
          results: `${appConfig.apiPrefix}/results`,
          reports: `${appConfig.apiPrefix}/reports`,
        },
        documentation: appConfig.development.enableApiDocs ?
          `http://localhost:${appConfig.port}/api/docs` : 'Not available in production',
      });
    });

    // API routes
    this.app.use(appConfig.apiPrefix, routes);
    console.log('📋 API routes initialized');
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      ApiResponse.notFound(res, 'Route not found');
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.details);
      }

      if (error.name === 'CastError') {
        return ApiResponse.badRequest(res, 'Invalid ID format');
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return ApiResponse.conflict(res, `${field} already exists`);
      }

      if (error.status === 401) {
        return ApiResponse.unauthorized(res, error.message);
      }

      if (error.status === 403) {
        return ApiResponse.forbidden(res, error.message);
      }

      if (error.status === 404) {
        return ApiResponse.notFound(res, error.message);
      }

      // Default server error
      return ApiResponse.serverError(
        res,
        appConfig.development.enableDebug ? error.message : 'Internal server error'
      );
    });
  }

  /**
   * Get Express app instance
   */
  public getApp(): Application {
    return this.app;
  }
}

export default App;