import { Router } from 'express';
import { TestController } from '../controllers/test.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();
const testController = new TestController();

// Apply authentication to all routes
router.use(authenticate);

// Test CRUD routes
router.post('/', authorize('admin', 'lab_technician'), validateRequest, testController.createTest);
router.get('/', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), testController.getAllTests);
router.get('/available', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), testController.getAvailableTests);
router.get('/panels/popular', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), testController.getPopularPanels);
router.get('/search', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), testController.searchTests);
router.get('/category/:category', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), testController.getTestsByCategory);
router.get('/:testId', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), testController.getTestById);
router.put('/:testId', authorize('admin', 'lab_technician'), validateRequest, testController.updateTest);
router.delete('/:testId', authorize('admin'), testController.deleteTest);
router.post('/:testId/duplicate', authorize('admin', 'lab_technician'), validateRequest, testController.duplicateTest);

export default router;