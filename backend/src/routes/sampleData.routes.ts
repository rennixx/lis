import { Router } from 'express';
import { generateSampleData } from '../controllers/sampleData.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication
router.use(authenticate);

// Generate sample data - admin only
router.post('/generate',
  authorize('admin'),
  generateSampleData
);

export default router;