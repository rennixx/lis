import { Router } from 'express';
import { ResultController } from '../controllers/result.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();
const resultController = new ResultController();

// Apply authentication to all routes
router.use(authenticate);

// Result CRUD routes
router.post('/', authorize('admin', 'lab_technician'), validateRequest, resultController.createResult);
router.get('/', authorize('admin', 'doctor', 'lab_technician'), resultController.getAllResults);
router.get('/statistics', authorize('admin', 'doctor', 'lab_technician'), resultController.getResultStatistics);
router.get('/critical', authorize('admin', 'doctor', 'lab_technician'), resultController.getCriticalResults);
router.get('/abnormal', authorize('admin', 'doctor', 'lab_technician'), resultController.getAbnormalResults);
router.get('/review', authorize('admin', 'lab_technician'), resultController.getResultsForReview);
router.get('/search', authorize('admin', 'doctor', 'lab_technician'), resultController.searchResults);
router.get('/:resultId', authorize('admin', 'doctor', 'lab_technician'), resultController.getResultById);
router.patch('/:resultId', authorize('admin', 'lab_technician'), validateRequest, resultController.updateResult);
router.patch('/:resultId/value', authorize('lab_technician'), validateRequest, resultController.updateResultValue);

// Result verification and rejection
router.post('/:resultId/verify', authorize('admin', 'lab_technician'), resultController.verifyResult);
router.post('/:resultId/reject', authorize('admin', 'lab_technician'), validateRequest, resultController.rejectResult);
router.post('/bulk-verify', authorize('admin', 'lab_technician'), validateRequest, resultController.bulkVerifyResults);
router.post('/bulk-reject', authorize('admin', 'lab_technician'), validateRequest, resultController.bulkRejectResults);

// Critical value management
router.post('/:resultId/mark-critical', authorize('admin', 'lab_technician'), resultController.markAsCritical);

// Comments and notes
router.post('/:resultId/comment', authorize('admin', 'lab_technician'), validateRequest, resultController.addComment);

// Order and patient specific results
router.get('/order/:orderId', authorize('admin', 'doctor', 'lab_technician'), resultController.getResultsByOrder);
router.get('/patient/:patientId', authorize('admin', 'doctor', 'lab_technician'), resultController.getResultsByPatient);

// Bulk result entry
router.post('/bulk', authorize('admin', 'lab_technician'), validateRequest, resultController.bulkCreateResults);

// PDF Generation and Download Routes
router.post('/:resultId/pdf', authorize('admin', 'lab_technician', 'doctor'), validateRequest, resultController.generateResultPDF);
router.get('/:resultId/pdf/download', authorize('admin', 'lab_technician', 'doctor'), resultController.downloadResultPDF);
router.get('/:resultId/pdf/view', authorize('admin', 'lab_technician', 'doctor'), resultController.viewResultPDF);

export default router;