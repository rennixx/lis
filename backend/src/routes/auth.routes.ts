import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const authController = new AuthController();

// Public routes (no authentication required)
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/init-admin', asyncHandler(authController.initAdmin));
router.post('/reset-admin', asyncHandler(authController.resetAdmin));
router.post('/fix-admin', asyncHandler(authController.fixAdminPassword));
router.get('/debug', asyncHandler(authController.debugUsers));
router.get('/health', asyncHandler(authController.healthCheck));

// Protected routes (authentication required)
router.use(authenticate); // Apply authentication to all routes below

router.get('/profile', asyncHandler(authController.getProfile));
router.put('/profile', asyncHandler(authController.updateProfile));
router.put('/change-password', asyncHandler(authController.changePassword));
router.post('/resend-verification', asyncHandler(authController.resendVerificationEmail));
router.post('/logout', asyncHandler(authController.logout));

// Admin-only routes (authentication + admin role required)
router.use('/admin', authorize('admin'));

router.get('/admin/users', asyncHandler(authController.getAllUsers));
router.put('/admin/users/:userId/status', asyncHandler(authController.updateUserStatus));
router.put('/admin/users/:userId/role', asyncHandler(authController.updateUserRole));
router.delete('/admin/users/:userId', asyncHandler(authController.deleteUser));

// Role-based routes (multiple roles)
router.get('/doctors', authorize('admin', 'doctor', 'lab_technician'), asyncHandler(authController.getAllUsers));
router.get('/technicians', authorize('admin', 'lab_technician'), asyncHandler(authController.getAllUsers));
router.get('/receptionists', authorize('admin', 'receptionist', 'doctor', 'lab_technician'), asyncHandler(authController.getAllUsers));

export default router;