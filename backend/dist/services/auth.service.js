"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const user_schema_1 = __importDefault(require("../schemas/user.schema"));
const Counter_model_1 = __importDefault(require("../models/Counter.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
const email_service_1 = require("./email.service");
const ApiError_1 = require("../utils/ApiError");
const constants_1 = require("../utils/constants");
const redis_config_1 = require("../config/redis.config");
class AuthService {
    async register(userData) {
        const { email, username, password, ...otherData } = userData;
        const existingUser = await user_schema_1.default.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });
        if (existingUser) {
            throw new ApiError_1.ApiError(400..toString(), 'User with this email or username already exists');
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        let mrn;
        if (userData.role === constants_1.ROLES.RECEPTIONIST || !userData.role) {
            mrn = await this.generateMRN();
        }
        const user = await user_schema_1.default.create({
            ...otherData,
            email: email.toLowerCase(),
            username,
            password: hashedPassword,
            mrn,
            isEmailVerified: otherData.isEmailVerified || false,
            isActive: true,
            lastLogin: new Date()
        });
        const userResponse = user.toObject();
        delete userResponse.password;
        return { user: userResponse };
    }
    async login(email, password) {
        const user = await user_schema_1.default.findOne({
            email: email.toLowerCase(),
            isActive: true
        }).select('+password');
        if (!user) {
            throw new ApiError_1.ApiError('Invalid credentials', 401);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError_1.ApiError('Invalid credentials', 401);
        }
        user.lastLogin = new Date();
        await user.save();
        const tokens = jwt_config_1.JWTService.generateTokens({
            userId: user._id,
            email: user.email,
            role: user.role
        });
        const accessToken = tokens.accessToken;
        const refreshToken = tokens.refreshToken;
        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push(refreshToken);
        if (user.refreshTokens.length > 5) {
            user.refreshTokens = user.refreshTokens.slice(-5);
        }
        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        return {
            user: userResponse,
            accessToken,
            refreshToken
        };
    }
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt_config_1.JWTService.verifyRefreshToken(refreshToken);
            const user = await user_schema_1.default.findOne({
                _id: decoded.userId,
                isActive: true,
                refreshTokens: refreshToken
            });
            if (!user) {
                throw new ApiError_1.ApiError(401..toString(), 'Invalid refresh token');
            }
            const accessToken = jwt_config_1.JWTService.generateAccessToken({
                userId: user._id,
                email: user.email,
                role: user.role
            });
            return { accessToken };
        }
        catch (error) {
            throw new ApiError_1.ApiError(401..toString(), 'Invalid refresh token');
        }
    }
    async logout(userId, refreshToken) {
        await user_schema_1.default.updateOne({ _id: userId }, { $pull: { refreshTokens: refreshToken } });
    }
    async blacklistToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return;
            }
            const expiryTime = decoded.exp * 1000;
            const currentTime = Date.now();
            const remainingTime = Math.max(0, expiryTime - currentTime);
            if (remainingTime > 0) {
                await redis_config_1.redisService.set(`blacklisted_token:${token}`, 'true', Math.ceil(remainingTime / 1000));
            }
        }
        catch (error) {
            console.warn('Failed to decode token for blacklisting:', error);
        }
    }
    async isTokenBlacklisted(token) {
        try {
            const isBlacklisted = await redis_config_1.redisService.get(`blacklisted_token:${token}`);
            return isBlacklisted === 'true';
        }
        catch (error) {
            return false;
        }
    }
    async getUserById(userId) {
        const user = await user_schema_1.default.findById(userId);
        if (!user) {
            throw new ApiError_1.ApiError(404..toString(), 'User not found');
        }
        return user;
    }
    async updateProfile(userId, updateData) {
        const user = await user_schema_1.default.findByIdAndUpdate(userId, {
            ...updateData,
            updatedAt: new Date()
        }, { new: true, runValidators: true });
        if (!user) {
            throw new ApiError_1.ApiError(404..toString(), 'User not found');
        }
        return user;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await user_schema_1.default.findById(userId).select('+password');
        if (!user) {
            throw new ApiError_1.ApiError(404..toString(), 'User not found');
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new ApiError_1.ApiError(400..toString(), 'Current password is incorrect');
        }
        const saltRounds = 12;
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        user.password = hashedNewPassword;
        user.refreshTokens = [];
        await user.save();
    }
    async forgotPassword(email) {
        const user = await user_schema_1.default.findOne({ email: email.toLowerCase(), isActive: true });
        if (!user) {
            return;
        }
        await email_service_1.emailService.sendPasswordResetEmail(email, user._id.toString());
    }
    async resetPassword(token, newPassword) {
        try {
            const tokenValidation = await email_service_1.emailService.verifyResetToken(token);
            if (!tokenValidation.valid) {
                throw new ApiError_1.ApiError(400..toString(), 'Invalid or expired reset token');
            }
            const user = await user_schema_1.default.findById(tokenValidation.userId);
            if (!user) {
                throw new ApiError_1.ApiError(400..toString(), 'Invalid or expired reset token');
            }
            const saltRounds = 12;
            const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
            user.password = hashedNewPassword;
            user.refreshTokens = [];
            await user.save();
            await email_service_1.emailService.invalidateResetToken(tokenValidation.userId);
        }
        catch (error) {
            throw new ApiError_1.ApiError(400..toString(), 'Invalid or expired reset token');
        }
    }
    async verifyEmail(token) {
        try {
            const tokenValidation = await email_service_1.emailService.verifyEmailToken(token);
            if (!tokenValidation.valid) {
                throw new ApiError_1.ApiError(400..toString(), 'Invalid verification token');
            }
            const user = await user_schema_1.default.findById(tokenValidation.userId);
            if (!user) {
                throw new ApiError_1.ApiError(400..toString(), 'Invalid verification token');
            }
            if (user.isVerified) {
                throw new ApiError_1.ApiError(400..toString(), 'Email already verified');
            }
            user.isVerified = true;
            await user.save();
            await email_service_1.emailService.invalidateVerificationToken(tokenValidation.userId);
        }
        catch (error) {
            throw new ApiError_1.ApiError(400..toString(), 'Invalid or expired verification token');
        }
    }
    async resendVerificationEmail(userId, email) {
        const user = await user_schema_1.default.findById(userId);
        if (!user) {
            throw new ApiError_1.ApiError(404..toString(), 'User not found');
        }
        if (user.isVerified) {
            throw new ApiError_1.ApiError(400..toString(), 'Email already verified');
        }
        await email_service_1.emailService.sendVerificationEmail(email, userId);
    }
    async getAllUsers(filters) {
        const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        let query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        if (role)
            query.role = role;
        if (isActive !== undefined)
            query.isActive = isActive;
        const users = await user_schema_1.default.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        const total = await user_schema_1.default.countDocuments(query);
        return { users, total };
    }
    async updateUserStatus(userId, isActive) {
        const user = await user_schema_1.default.findByIdAndUpdate(userId, { isActive, updatedAt: new Date() }, { new: true, runValidators: true });
        if (!user) {
            throw new ApiError_1.ApiError(404..toString(), 'User not found');
        }
        return user;
    }
    async updateUserRole(userId, role) {
        const user = await user_schema_1.default.findByIdAndUpdate(userId, { role, updatedAt: new Date() }, { new: true, runValidators: true });
        if (!user) {
            throw new ApiError_1.ApiError(404..toString(), 'User not found');
        }
        return user;
    }
    async deleteUser(userId) {
        const user = await user_schema_1.default.findById(userId);
        if (!user) {
            throw new ApiError_1.ApiError(404..toString(), 'User not found');
        }
        user.isActive = false;
        await user.save();
    }
    async generateMRN() {
        const counter = await Counter_model_1.default.findByIdAndUpdate('patient_mrn', { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `PT${year}${month}${String(counter.sequence).padStart(6, '0')}`;
    }
}
exports.AuthService = AuthService;
