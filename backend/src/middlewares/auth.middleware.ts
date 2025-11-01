// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';
import { jwtConfig } from '../config/jwt.config';
import { ApiError } from '../utils/ApiError';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 [AUTH] Starting authentication for:', req.method, req.originalUrl);

    const authHeader = req.headers.authorization;
    console.log('🔍 [AUTH] Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔍 [AUTH] No valid Bearer token found');
      throw new ApiError(401 as any, 'Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 [AUTH] Token extracted (first 10 chars):', token.substring(0, 10) + '...');

    const decoded = jwt.verify(token, jwtConfig.secret) as any;
    console.log('🔍 [AUTH] Token decoded successfully, userId:', decoded.userId);
    console.log('🔍 [AUTH] User model available:', !!User);
    console.log('🔍 [AUTH] User.findById function:', typeof User.findById);

    const user = await User.findById(decoded.userId).select('-password');
    console.log('🔍 [AUTH] User lookup result:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('🔍 [AUTH] User not found for ID:', decoded.userId);
      throw new ApiError(401 as any, 'Invalid token');
    }

    if (!user.isActive) {
      console.log('🔍 [AUTH] User account is disabled');
      throw new ApiError(401 as any, 'Account is disabled');
    }

    console.log('🔍 [AUTH] Authentication successful for user:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('🔍 [AUTH] Authentication error:', error.message);
    console.log('🔍 [AUTH] Error type:', error.constructor.name);

    if (error instanceof jwt.JsonWebTokenError) {
      console.log('🔍 [AUTH] JWT verification failed');
      next(new ApiError(401 as any, 'Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      console.log('🔍 [AUTH] JWT token expired');
      next(new ApiError(401 as any, 'Token expired'));
    } else {
      console.log('🔍 [AUTH] Other auth error:', error);
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401 as any, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403 as any, 'Insufficient permissions'));
    }

    next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtConfig.secret) as any;

    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors
    next();
  }
};