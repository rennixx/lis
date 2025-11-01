"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const jwt_config_1 = require("../config/jwt.config");
const ApiError_1 = require("../utils/ApiError");
const authenticate = async (req, res, next) => {
    try {
        console.log('🔍 [AUTH] Starting authentication for:', req.method, req.originalUrl);
        const authHeader = req.headers.authorization;
        console.log('🔍 [AUTH] Auth header:', authHeader ? 'Present' : 'Missing');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('🔍 [AUTH] No valid Bearer token found');
            throw new ApiError_1.ApiError(401, 'Access token is required');
        }
        const token = authHeader.substring(7);
        console.log('🔍 [AUTH] Token extracted (first 10 chars):', token.substring(0, 10) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.secret);
        console.log('🔍 [AUTH] Token decoded successfully, userId:', decoded.userId);
        console.log('🔍 [AUTH] User model available:', !!User_model_1.default);
        console.log('🔍 [AUTH] User.findById function:', typeof User_model_1.default.findById);
        const user = await User_model_1.default.findById(decoded.userId).select('-password');
        console.log('🔍 [AUTH] User lookup result:', user ? 'Found' : 'Not found');
        if (!user) {
            console.log('🔍 [AUTH] User not found for ID:', decoded.userId);
            throw new ApiError_1.ApiError(401, 'Invalid token');
        }
        if (!user.isActive) {
            console.log('🔍 [AUTH] User account is disabled');
            throw new ApiError_1.ApiError(401, 'Account is disabled');
        }
        console.log('🔍 [AUTH] Authentication successful for user:', user.email);
        req.user = user;
        next();
    }
    catch (error) {
        console.log('🔍 [AUTH] Authentication error:', error.message);
        console.log('🔍 [AUTH] Error type:', error.constructor.name);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            console.log('🔍 [AUTH] JWT verification failed');
            next(new ApiError_1.ApiError(401, 'Invalid token'));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            console.log('🔍 [AUTH] JWT token expired');
            next(new ApiError_1.ApiError(401, 'Token expired'));
        }
        else {
            console.log('🔍 [AUTH] Other auth error:', error);
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError_1.ApiError(401, 'Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError_1.ApiError(403, 'Insufficient permissions'));
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.secret);
        const user = await User_model_1.default.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
