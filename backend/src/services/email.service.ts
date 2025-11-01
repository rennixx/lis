// @ts-nocheck
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { redisService } from '../config/redis.config';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, userId: string): Promise<void> {
    try {
      // Generate reset token (15 minutes expiry)
      const resetToken = jwt.sign(
        { userId, type: 'password_reset' },
        jwtConfig.refreshSecret,
        { expiresIn: '15m' }
      );

      // Store token in Redis with expiry
      await redisService.set(`reset_token:${userId}`, resetToken, 900); // 15 minutes

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: 'Password Reset Request - Laboratory Information System',
        html: this.generatePasswordResetTemplate(resetLink, email)
      };

      await this.sendEmail(emailOptions);

      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, userId: string): Promise<void> {
    try {
      // Generate verification token (24 hours expiry)
      const verificationToken = jwt.sign(
        { userId, type: 'email_verification' },
        jwtConfig.secret,
        { expiresIn: '24h' }
      );

      // Store token in Redis with expiry
      await redisService.set(`verify_token:${userId}`, verificationToken, 86400); // 24 hours

      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: 'Verify Your Email - Laboratory Information System',
        html: this.generateEmailVerificationTemplate(verificationLink, email)
      };

      await this.sendEmail(emailOptions);

      logger.info(`Verification email sent to: ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string): Promise<{ userId: string; valid: boolean }> {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshSecret) as any;

      if (decoded.type !== 'password_reset') {
        return { userId: '', valid: false };
      }

      // Check if token exists in Redis
      const storedToken = await redisService.get(`reset_token:${decoded.userId}`);

      if (!storedToken || storedToken !== token) {
        return { userId: '', valid: false };
      }

      return { userId: decoded.userId, valid: true };
    } catch (error) {
      return { userId: '', valid: false };
    }
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(token: string): Promise<{ userId: string; valid: boolean }> {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as any;

      if (decoded.type !== 'email_verification') {
        return { userId: '', valid: false };
      }

      // Check if token exists in Redis
      const storedToken = await redisService.get(`verify_token:${decoded.userId}`);

      if (!storedToken || storedToken !== token) {
        return { userId: '', valid: false };
      }

      return { userId: decoded.userId, valid: true };
    } catch (error) {
      return { userId: '', valid: false };
    }
  }

  /**
   * Invalidate password reset token
   */
  async invalidateResetToken(userId: string): Promise<void> {
    await redisService.del(`reset_token:${userId}`);
  }

  /**
   * Invalidate email verification token
   */
  async invalidateVerificationToken(userId: string): Promise<void> {
    await redisService.del(`verify_token:${userId}`);
  }

  /**
   * Send email (placeholder implementation)
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    // In development, just log the email content
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 EMAIL SERVICE (Development Mode)');
      logger.info(`To: ${options.to}`);
      logger.info(`Subject: ${options.subject}`);
      logger.info('HTML Content:', options.html?.substring(0, 200) + '...');

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return;
    }

    // TODO: Implement actual email service (SendGrid, AWS SES, etc.)
    // Example with nodemailer:
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
    */
  }

  /**
   * Generate password reset email template
   */
  private generatePasswordResetTemplate(resetLink: string, email: string): string {
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

  /**
   * Generate email verification template
   */
  private generateEmailVerificationTemplate(verificationLink: string, email: string): string {
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

// Export singleton instance
export const emailService = EmailService.getInstance();

export default emailService;