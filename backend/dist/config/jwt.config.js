"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = exports.jwtConfig = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
exports.jwtConfig = {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-lis-2024',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production-lis-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'lis-backend',
    audience: 'lis-frontend',
};
class JWTService {
    static generateAccessToken(payload) {
        try {
            const options = {
                expiresIn: exports.jwtConfig.expiresIn,
                issuer: exports.jwtConfig.issuer,
                audience: exports.jwtConfig.audience,
            };
            return jsonwebtoken_1.default.sign(payload, exports.jwtConfig.secret, options);
        }
        catch (error) {
            logger_1.logger.error('Error generating access token:', error);
            throw new Error('Failed to generate access token');
        }
    }
    static generateRefreshToken(payload) {
        try {
            const options = {
                expiresIn: exports.jwtConfig.refreshExpiresIn,
                issuer: exports.jwtConfig.issuer,
                audience: exports.jwtConfig.audience,
            };
            return jsonwebtoken_1.default.sign(payload, exports.jwtConfig.refreshSecret, options);
        }
        catch (error) {
            logger_1.logger.error('Error generating refresh token:', error);
            throw new Error('Failed to generate refresh token');
        }
    }
    static generateTokens(payload) {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        return { accessToken, refreshToken };
    }
    static verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, exports.jwtConfig.secret, {
                issuer: exports.jwtConfig.issuer,
                audience: exports.jwtConfig.audience,
            });
            return decoded;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token has expired');
            }
            else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid access token');
            }
            else {
                logger_1.logger.error('Error verifying access token:', error);
                throw new Error('Failed to verify access token');
            }
        }
    }
    static verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, exports.jwtConfig.refreshSecret, {
                issuer: exports.jwtConfig.issuer,
                audience: exports.jwtConfig.audience,
            });
            return decoded;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token has expired');
            }
            else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            }
            else {
                logger_1.logger.error('Error verifying refresh token:', error);
                throw new Error('Failed to verify refresh token');
            }
        }
    }
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger_1.logger.error('Error decoding token:', error);
            return null;
        }
    }
    static getTokenExpiration(token) {
        try {
            const decoded = this.decodeToken(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    static isTokenExpired(token) {
        const expiration = this.getTokenExpiration(token);
        if (!expiration)
            return true;
        return expiration <= new Date();
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader)
            return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1];
    }
}
exports.JWTService = JWTService;
exports.default = JWTService;
