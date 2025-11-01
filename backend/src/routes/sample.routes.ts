import { Router } from 'express';
import { SampleController } from '../controllers/sample.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const sampleController = new SampleController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/samples
 * @desc    Get all samples with filters and pagination
 * @access  Private
 */
router.get('/', sampleController.getSamples);

/**
 * @route   GET /api/v1/samples/queue
 * @desc    Get pending collections queue
 * @access  Private
 */
router.get('/queue', sampleController.getPendingCollectionsQueue);

/**
 * @route   GET /api/v1/samples/statistics
 * @desc    Get collection statistics
 * @access  Private
 */
router.get('/statistics', sampleController.getCollectionStatistics);

/**
 * @route   GET /api/v1/samples/status-counts
 * @desc    Get samples by status counts
 * @access  Private
 */
router.get('/status-counts', sampleController.getSamplesByStatusCounts);

/**
 * @route   GET /api/v1/samples/search
 * @desc    Search samples
 * @access  Private
 */
router.get('/search', sampleController.searchSamples);

/**
 * @route   POST /api/v1/samples
 * @desc    Create new sample
 * @access  Private
 * @roles   lab_technician, nurse, doctor, admin
 */
router.post(
  '/',
  authorize('lab_technician', 'nurse', 'doctor', 'admin'),
  sampleController.createSample
);

/**
 * @route   POST /api/v1/samples/bulk-status
 * @desc    Bulk update sample status
 * @access  Private
 * @roles   lab_technician, admin
 */
router.post(
  '/bulk-status',
  authorize('lab_technician', 'admin'),
  sampleController.bulkUpdateStatus
);

/**
 * @route   POST /api/v1/samples/receive
 * @desc    Receive samples in laboratory
 * @access  Private
 * @roles   lab_technician, admin
 */
router.post(
  '/receive',
  authorize('lab_technician', 'admin'),
  sampleController.receiveSamples
);

/**
 * @route   POST /api/v1/samples/start-processing
 * @desc    Start processing samples
 * @access  Private
 * @roles   lab_technician, admin
 */
router.post(
  '/start-processing',
  authorize('lab_technician', 'admin'),
  sampleController.startProcessing
);

/**
 * @route   POST /api/v1/samples/complete-processing
 * @desc    Complete sample processing
 * @access  Private
 * @roles   lab_technician, admin
 */
router.post(
  '/complete-processing',
  authorize('lab_technician', 'admin'),
  sampleController.completeProcessing
);

/**
 * @route   POST /api/v1/samples/print-labels
 * @desc    Print sample labels
 * @access  Private
 * @roles   lab_technician, nurse, admin
 */
router.post(
  '/print-labels',
  authorize('lab_technician', 'nurse', 'admin'),
  sampleController.printSampleLabels
);

/**
 * @route   GET /api/v1/samples/:id
 * @desc    Get sample by ID
 * @access  Private
 */
router.get('/:id', sampleController.getSampleById);

/**
 * @route   GET /api/v1/samples/barcode/:barcode
 * @desc    Get sample by barcode
 * @access  Private
 */
router.get('/barcode/:barcode', sampleController.getSampleByBarcode);

/**
 * @route   GET /api/v1/samples/:id/barcode
 * @desc    Generate barcode for sample
 * @access  Private
 */
router.get('/:id/barcode', sampleController.generateBarcode);

/**
 * @route   POST /api/v1/samples/:id/confirm-collection
 * @desc    Confirm sample collection
 * @access  Private
 * @roles   nurse, lab_technician, admin
 */
router.post(
  '/:id/confirm-collection',
  authorize('nurse', 'lab_technician', 'admin'),
  sampleController.confirmCollection
);

export default router;