import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();
const reportController = new ReportController();

// Apply authentication to all routes
router.use(authenticate);

// Basic CRUD routes - only existing methods
router.get('/', authorize('admin', 'doctor', 'lab_technician'), reportController.getAllReports);
router.get('/search', authorize('admin', 'doctor', 'lab_technician'), reportController.searchReports);
router.get('/statistics', authorize('admin', 'doctor', 'lab_technician'), reportController.getReportStatistics);
router.get('/:reportId', authorize('admin', 'doctor', 'lab_technician'), reportController.getReportById);
router.patch('/:reportId/status', authorize('admin', 'lab_technician'), validateRequest, reportController.updateReportStatus);
router.delete('/:reportId', authorize('admin'), reportController.deleteReport);

// PDF Generation and Download Routes
router.post('/generate/:orderId', authorize('admin', 'lab_technician'), reportController.generateReportFromOrder);
router.post('/:reportId/pdf', authorize('admin', 'doctor', 'lab_technician'), reportController.generatePDFForReport);
router.get('/:reportId/pdf/download', authorize('admin', 'doctor', 'lab_technician'), reportController.downloadReportPDF);
router.get('/:reportId/pdf/view', authorize('admin', 'doctor', 'lab_technician'), reportController.viewReportPDF);

// Bulk operations
router.post('/bulk-generate', authorize('admin', 'lab_technician'), reportController.generateBulkReports);

export default router;