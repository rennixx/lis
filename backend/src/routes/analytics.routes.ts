import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/auth.middleware';

const router = Router();


// Apply authentication to all routes
router.use(authenticate);

// Dashboard overview - accessible to all authenticated users
router.get('/dashboard', analyticsController.getDashboardMetrics);

// Detailed statistics - admin and doctor access
router.get('/statistics',
  authorize('admin', 'doctor'),
  analyticsController.getDetailedStatistics
);

// Test utilization analytics - admin and doctor access
router.get('/tests/utilization',
  authorize('admin', 'doctor'),
  analyticsController.getTestUtilization
);

// Revenue analytics - admin only
router.get('/revenue',
  authorize('admin'),
  analyticsController.getRevenueAnalytics
);

// Operational metrics - admin and lab technician access
router.get('/operational',
  authorize('admin', 'lab_technician'),
  analyticsController.getOperationalMetrics
);

// Export data - admin only
router.get('/export',
  authorize('admin'),
  analyticsController.exportAnalyticsData
);

export default router;