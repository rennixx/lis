"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_validator_1 = require("../validators/auth.validator");
const auth_service_1 = require("../services/auth.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const jwt_config_1 = require("../config/jwt.config");
const redis_config_1 = require("../config/redis.config");
const User_model_1 = __importDefault(require("../models/User.model"));
const authService = new auth_service_1.AuthService();
class AuthController {
    constructor() {
        this.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const validatedData = auth_validator_1.AuthZodSchema.register.parse(req.body);
            const result = await authService.register(validatedData);
            return ApiResponse_1.ApiResponse.created(res, 'User registered successfully', {
                user: result.user,
                message: 'Registration successful. Please check your email to verify your account.'
            });
        });
        this.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const validatedData = auth_validator_1.AuthZodSchema.login.parse(req.body);
            const result = await authService.login(validatedData.email, validatedData.password);
            return ApiResponse_1.ApiResponse.success(res, 'Login successful', {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresIn: jwt_config_1.jwtConfig.expiresIn
            });
        });
        this.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { refreshToken } = auth_validator_1.AuthZodSchema.refresh.parse(req.body);
            const result = await authService.refreshAccessToken(refreshToken);
            return ApiResponse_1.ApiResponse.success(res, 'Token refreshed successfully', {
                accessToken: result.accessToken,
                expiresIn: jwt_config_1.jwtConfig.expiresIn
            });
        });
        this.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { refreshToken } = req.body;
            const authHeader = req.headers.authorization;
            let accessToken = '';
            if (authHeader && authHeader.startsWith('Bearer ')) {
                accessToken = authHeader.substring(7);
            }
            if (req.user) {
                await authService.logout(req.user._id.toString(), refreshToken);
                if (accessToken) {
                    await authService.blacklistToken(accessToken);
                }
            }
            return ApiResponse_1.ApiResponse.success(res, 'Logout successful');
        });
        this.getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(401, 'User not authenticated');
            }
            return ApiResponse_1.ApiResponse.success(res, 'Profile retrieved successfully', req.user);
        });
        this.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(401, 'User not authenticated');
            }
            const validatedData = auth_validator_1.AuthZodSchema.updateProfile.parse(req.body);
            const updatedUser = await authService.updateProfile(req.user._id.toString(), validatedData);
            return ApiResponse_1.ApiResponse.success(res, 'Profile updated successfully', updatedUser);
        });
        this.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(401, 'User not authenticated');
            }
            const { currentPassword, newPassword, confirmPassword } = auth_validator_1.AuthZodSchema.changePassword.parse(req.body);
            await authService.changePassword(req.user._id.toString(), currentPassword, newPassword);
            return ApiResponse_1.ApiResponse.success(res, 'Password changed successfully');
        });
        this.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { email } = auth_validator_1.AuthZodSchema.forgotPassword.parse(req.body);
            await authService.forgotPassword(email);
            return ApiResponse_1.ApiResponse.success(res, 'If an account with that email exists, a password reset link has been sent.');
        });
        this.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { token, newPassword, confirmPassword } = auth_validator_1.AuthZodSchema.resetPassword.parse(req.body);
            await authService.resetPassword(token, newPassword);
            return ApiResponse_1.ApiResponse.success(res, 'Password reset successfully');
        });
        this.verifyEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { token } = req.body;
            await authService.verifyEmail(token);
            return ApiResponse_1.ApiResponse.success(res, 'Email verified successfully');
        });
        this.resendVerificationEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(401, 'User not authenticated');
            }
            await authService.resendVerificationEmail(req.user._id.toString(), req.user.email);
            return ApiResponse_1.ApiResponse.success(res, 'Verification email sent successfully');
        });
        this.updateUserStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId } = req.params;
            const { isActive } = auth_validator_1.AuthZodSchema.updateUserStatus.parse(req.body);
            const updatedUser = await authService.updateUserStatus(userId, isActive);
            return ApiResponse_1.ApiResponse.success(res, 'User status updated successfully', {
                data: updatedUser
            });
        });
        this.updateUserRole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId } = req.params;
            const { role } = auth_validator_1.AuthZodSchema.updateUserRole.parse(req.body);
            const updatedUser = await authService.updateUserRole(userId, role);
            return ApiResponse_1.ApiResponse.success(res, 'User role updated successfully', {
                data: updatedUser
            });
        });
        this.getAllUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                role: role,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await authService.getAllUsers(filters);
            return ApiResponse_1.ApiResponse.success(res, 'Users retrieved successfully', {
                users: result.users,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    pages: Math.ceil(result.total / filters.limit)
                }
            });
        });
        this.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId } = req.params;
            await authService.deleteUser(userId);
            return ApiResponse_1.ApiResponse.success(res, 'User deleted successfully');
        });
        this.healthCheck = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const health = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'connected',
                    redis: redis_config_1.redisService.isRedisConnected() ? 'connected' : 'disconnected',
                    email: 'ready'
                }
            };
            return ApiResponse_1.ApiResponse.success(res, 'Auth service is healthy', health);
        });
        this.initAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
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
                const existingAdmin = await User_model_1.default.findOne({
                    $or: [{ email: adminData.email }, { username: adminData.username }]
                });
                if (existingAdmin) {
                    return ApiResponse_1.ApiResponse.success(res, 'Admin user already exists', {
                        email: adminData.email,
                        username: adminData.username,
                        role: adminData.role
                    });
                }
                const result = await authService.register(adminData);
                await User_model_1.default.findByIdAndUpdate(result.user._id, {
                    isEmailVerified: true,
                    isActive: true
                });
                return ApiResponse_1.ApiResponse.success(res, 'Admin user created successfully', {
                    email: adminData.email,
                    username: adminData.username,
                    password: adminData.password,
                    role: adminData.role
                });
            }
            catch (error) {
                throw new ApiError_1.ApiError('Failed to create admin user: ' + error.message, 500);
            }
        });
        this.resetAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                await User_model_1.default.deleteOne({ email: 'admin@lis.com' });
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
                });
                return ApiResponse_1.ApiResponse.success(res, 'Admin user reset successfully', {
                    email: 'admin@lis.com',
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin'
                });
            }
            catch (error) {
                throw new ApiError_1.ApiError('Failed to reset admin user: ' + error.message, 500);
            }
        });
        this.debugUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const users = await User_model_1.default.find({}).select('+password').lean();
                const debugInfo = users.map((user) => ({
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    isActive: user.isActive,
                    isEmailVerified: user.isEmailVerified,
                    hasPassword: !!user.password,
                    passwordLength: user.password ? user.password.length : 0
                }));
                return ApiResponse_1.ApiResponse.success(res, 'Debug users info', debugInfo);
            }
            catch (error) {
                throw new ApiError_1.ApiError('Debug error: ' + error.message, 500);
            }
        });
        this.fixAdminPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const bcrypt = require('bcryptjs');
                const password = 'admin123';
                const hashedPassword = await bcrypt.hash(password, 12);
                console.log('Generated hash:', hashedPassword);
                console.log('Hash length:', hashedPassword.length);
                const result = await User_model_1.default.updateOne({ email: 'admin@lis.com' }, {
                    password: hashedPassword,
                    isEmailVerified: true,
                    isActive: true
                });
                console.log('Update result:', result);
                return ApiResponse_1.ApiResponse.success(res, 'Admin password fixed successfully', {
                    email: 'admin@lis.com',
                    password: password,
                    hashLength: hashedPassword.length,
                    updated: result.modifiedCount > 0
                });
            }
            catch (error) {
                throw new ApiError_1.ApiError('Failed to fix admin password: ' + error.message, 500);
            }
        });
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
