import { Request, Response } from 'express';
import { AuthZodSchema } from '../validators/auth.validator';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { authenticate } from '../middlewares/auth.middleware';
import { redisService } from '../config/redis.config';
// @ts-ignore
import User from '../models/User.model';

const authService = new AuthService();

export class AuthController {
  // User Registration
  register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = AuthZodSchema.register.parse(req.body);

    // @ts-ignore
    const result = await authService.register(validatedData as any);

    return ApiResponse.created(res, 'User registered successfully', {
      user: result.user,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  });

  // User Login
  login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = AuthZodSchema.login.parse(req.body);

    const result = await authService.login(validatedData.email, validatedData.password);

    return ApiResponse.success(res, 'Login successful', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: jwtConfig.expiresIn
      });
  });

  // Refresh Access Token
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = AuthZodSchema.refresh.parse(req.body);

    const result = await authService.refreshAccessToken(refreshToken);

    return ApiResponse.success(res, 'Token refreshed successfully', {
        accessToken: result.accessToken,
        expiresIn: jwtConfig.expiresIn
      });
  });

  // Logout User
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    let accessToken = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }

    // Get user ID from authenticated request
    if (req.user) {
      await authService.logout((req.user._id as any).toString(), refreshToken);

      // Blacklist the access token if provided
      if (accessToken) {
        await authService.blacklistToken(accessToken);
      }
    }

    return ApiResponse.success(res, 'Logout successful');
  });

  // Get Current User Profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    // User is already attached to request by authenticate middleware
    if (!req.user) {
      // @ts-ignore
      throw new ApiError(401 as any, 'User not authenticated');
    }

    return ApiResponse.success(res, 'Profile retrieved successfully', req.user);
  });

  // Update Profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      // @ts-ignore
      throw new ApiError(401 as any, 'User not authenticated');
    }

    const validatedData = AuthZodSchema.updateProfile.parse(req.body);

    const updatedUser = await authService.updateProfile((req.user._id as any).toString(), validatedData);

    return ApiResponse.success(res, 'Profile updated successfully', updatedUser);
  });

  // Change Password
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      // @ts-ignore
      throw new ApiError(401 as any, 'User not authenticated');
    }

    const { currentPassword, newPassword, confirmPassword } = AuthZodSchema.changePassword.parse(req.body);

    await authService.changePassword((req.user._id as any).toString(), currentPassword, newPassword);

    return ApiResponse.success(res, 'Password changed successfully');
  });

  // Forgot Password
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = AuthZodSchema.forgotPassword.parse(req.body);

    await authService.forgotPassword(email);

    // Always return success to prevent email enumeration attacks
    return ApiResponse.success(res, 'If an account with that email exists, a password reset link has been sent.');
  });

  // Reset Password
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword, confirmPassword } = AuthZodSchema.resetPassword.parse(req.body);

    await authService.resetPassword(token, newPassword);

    return ApiResponse.success(res, 'Password reset successfully');
  });

  // Verify Email
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    await authService.verifyEmail(token);

    return ApiResponse.success(res, 'Email verified successfully');
  });

  // Resend Verification Email
  resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      // @ts-ignore
      throw new ApiError(401 as any, 'User not authenticated');
    }

    await authService.resendVerificationEmail((req.user._id as any).toString(), req.user.email as string);

    return ApiResponse.success(res, 'Verification email sent successfully');
  });

  // Update User Status (Admin only)
  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { isActive } = AuthZodSchema.updateUserStatus.parse(req.body);

    const updatedUser = await authService.updateUserStatus(userId, isActive);

    return ApiResponse.success(res, 'User status updated successfully', {
        data: updatedUser
      });
  });

  // Update User Role (Admin only)
  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = AuthZodSchema.updateUserRole.parse(req.body);

    const updatedUser = await authService.updateUserRole(userId, role);

    return ApiResponse.success(res, 'User role updated successfully', {
        data: updatedUser
      });
  });

  // Get All Users (Admin only)
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      role: role as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await authService.getAllUsers(filters);

    return ApiResponse.success(res, 'Users retrieved successfully', {
        users: result.users,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          pages: Math.ceil(result.total / filters.limit)
        }
      });
  });

  // Delete User (Admin only)
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    await authService.deleteUser(userId);

    return ApiResponse.success(res, 'User deleted successfully');
  });

  // Health check for auth service
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisService.isRedisConnected() ? 'connected' : 'disconnected',
        email: 'ready'
      }
    };

    return ApiResponse.success(res, 'Auth service is healthy', health);
  });

  // Initialize Admin User (for development/setup)
  initAdmin = asyncHandler(async (req: Request, res: Response) => {
    const adminData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@lis.com',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      phoneNumber: '0000000000',
      isEmailVerified: true,
      isActive: true
    };

    try {
      // Check if admin already exists
      const existingAdmin = await (User as any).findOne({
        $or: [{ email: adminData.email }, { username: adminData.username }]
      });

      if (existingAdmin) {
        return ApiResponse.success(res, 'Admin user already exists', {
          email: adminData.email,
          username: adminData.username,
          role: adminData.role
        });
      }

      // Create admin user
      const result = await authService.register(adminData as any);

      // Manually verify and activate the admin user
      await (User as any).findByIdAndUpdate((result.user as any)._id, {
        isEmailVerified: true,
        isActive: true
      });

      return ApiResponse.success(res, 'Admin user created successfully', {
        email: adminData.email,
        username: adminData.username,
        password: adminData.password,
        role: adminData.role
      });
    } catch (error: any) {
      throw new ApiError('Failed to create admin user: ' + error.message, 500);
    }
  });

  // Reset Admin User (delete and recreate)
  resetAdmin = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Delete existing admin user
      await (User as any).deleteOne({ email: 'admin@lis.com' });

      // Create new admin user
      const result = await authService.register({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@lis.com',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        phoneNumber: '0000000000',
        isEmailVerified: true,
        isActive: true
      } as any);

      return ApiResponse.success(res, 'Admin user reset successfully', {
        email: 'admin@lis.com',
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
    } catch (error: any) {
      throw new ApiError('Failed to reset admin user: ' + error.message, 500);
    }
  });

  // Debug users (for development)
  debugUsers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const users = await (User as any).find({}).select('+password').lean();
      const debugInfo = users.map((user: any) => ({
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      }));

      return ApiResponse.success(res, 'Debug users info', debugInfo);
    } catch (error: any) {
      throw new ApiError('Debug error: ' + error.message, 500);
    }
  });

  // Fix Admin Password (manual password fix)
  fixAdminPassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const bcrypt = require('bcryptjs');
      const password = 'admin123';
      const hashedPassword = await bcrypt.hash(password, 12);

      console.log('Generated hash:', hashedPassword);
      console.log('Hash length:', hashedPassword.length);

      // Update admin user password directly
      const result = await (User as any).updateOne(
        { email: 'admin@lis.com' },
        {
          password: hashedPassword,
          isEmailVerified: true,
          isActive: true
        }
      );

      console.log('Update result:', result);

      return ApiResponse.success(res, 'Admin password fixed successfully', {
        email: 'admin@lis.com',
        password: password,
        hashLength: hashedPassword.length,
        updated: result.modifiedCount > 0
      });
    } catch (error: any) {
      throw new ApiError('Failed to fix admin password: ' + error.message, 500);
    }
  });
}

export default AuthController;