"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
const redis_config_1 = require("../config/redis.config");
const logger_1 = require("../utils/logger");
class EmailService {
    constructor() { }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    async sendPasswordResetEmail(email, userId) {
        try {
            const resetToken = jsonwebtoken_1.default.sign({ userId, type: 'password_reset' }, jwt_config_1.jwtConfig.refreshSecret, { expiresIn: '15m' });
            await redis_config_1.redisService.set(`reset_token:${userId}`, resetToken, 900);
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            const emailOptions = {
                to: email,
                subject: 'Password Reset Request - Laboratory Information System',
                html: this.generatePasswordResetTemplate(resetLink, email)
            };
            await this.sendEmail(emailOptions);
            logger_1.logger.info(`Password reset email sent to: ${email}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send password reset email to ${email}:`, error);
            throw new Error('Failed to send password reset email');
        }
    }
    async sendVerificationEmail(email, userId) {
        try {
            const verificationToken = jsonwebtoken_1.default.sign({ userId, type: 'email_verification' }, jwt_config_1.jwtConfig.secret, { expiresIn: '24h' });
            await redis_config_1.redisService.set(`verify_token:${userId}`, verificationToken, 86400);
            const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
            const emailOptions = {
                to: email,
                subject: 'Verify Your Email - Laboratory Information System',
                html: this.generateEmailVerificationTemplate(verificationLink, email)
            };
            await this.sendEmail(emailOptions);
            logger_1.logger.info(`Verification email sent to: ${email}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send verification email to ${email}:`, error);
            throw new Error('Failed to send verification email');
        }
    }
    async verifyResetToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.refreshSecret);
            if (decoded.type !== 'password_reset') {
                return { userId: '', valid: false };
            }
            const storedToken = await redis_config_1.redisService.get(`reset_token:${decoded.userId}`);
            if (!storedToken || storedToken !== token) {
                return { userId: '', valid: false };
            }
            return { userId: decoded.userId, valid: true };
        }
        catch (error) {
            return { userId: '', valid: false };
        }
    }
    async verifyEmailToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.secret);
            if (decoded.type !== 'email_verification') {
                return { userId: '', valid: false };
            }
            const storedToken = await redis_config_1.redisService.get(`verify_token:${decoded.userId}`);
            if (!storedToken || storedToken !== token) {
                return { userId: '', valid: false };
            }
            return { userId: decoded.userId, valid: true };
        }
        catch (error) {
            return { userId: '', valid: false };
        }
    }
    async invalidateResetToken(userId) {
        await redis_config_1.redisService.del(`reset_token:${userId}`);
    }
    async invalidateVerificationToken(userId) {
        await redis_config_1.redisService.del(`verify_token:${userId}`);
    }
    async sendEmail(options) {
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.info('📧 EMAIL SERVICE (Development Mode)');
            logger_1.logger.info(`To: ${options.to}`);
            logger_1.logger.info(`Subject: ${options.subject}`);
            logger_1.logger.info('HTML Content:', options.html?.substring(0, 200) + '...');
            await new Promise(resolve => setTimeout(resolve, 100));
            return;
        }
    }
    generatePasswordResetTemplate(resetLink, email) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Laboratory Information System</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your account associated with this email address: <strong>${email}</strong></p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in 15 minutes for security reasons</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2024 Laboratory Information System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateEmailVerificationTemplate(verificationLink, email) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Laboratory Information System</h1>
            <h2>Email Verification</h2>
          </div>
          <div class="content">
            <p>Welcome!</p>
            <p>Thank you for registering with the Laboratory Information System. To complete your registration and activate your account, please verify your email address: <strong>${email}</strong></p>
            <p>Click the button below to verify your email:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email</a>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This verification link will expire in 24 hours</li>
              <li>You must verify your email before you can access all features</li>
              <li>If you didn't create an account, please ignore this email</li>
            </ul>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationLink}</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2024 Laboratory Information System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
}
exports.EmailService = EmailService;
exports.emailService = EmailService.getInstance();
exports.default = exports.emailService;
