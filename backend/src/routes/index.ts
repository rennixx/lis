import { Router } from 'express';
import { appConfig } from '../config/app.config';
import { ApiResponse } from '../utils/ApiResponse';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import orderRoutes from './order.routes';
import testRoutes from './test.routes';
import sampleRoutes from './sample.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  ApiResponse.success(res, JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'LIS Backend API',
    version: '1.0.0',
  }));
});

// API routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/orders', orderRoutes);
router.use('/tests', testRoutes);
router.use('/samples', sampleRoutes);

export default router;