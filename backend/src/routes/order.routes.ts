import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();
const orderController = new OrderController();

// Apply authentication to all routes
router.use(authenticate);

// Order CRUD routes
router.post('/', authorize('admin', 'doctor', 'nurse', 'receptionist'), validateRequest, orderController.createOrder);
router.get('/', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), orderController.getAllOrders);
router.get('/statistics', authorize('admin', 'doctor', 'lab_technician'), orderController.getOrderStatistics);
router.get('/recent', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), orderController.getRecentOrders);
router.get('/overdue', authorize('admin', 'lab_technician'), orderController.getOverdueOrders);
router.get('/number/:orderNumber', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), orderController.getOrderByNumber);
router.get('/:orderId', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), orderController.getOrderById);
router.put('/:orderId', authorize('admin', 'doctor', 'nurse', 'receptionist'), validateRequest, orderController.updateOrder);
router.delete('/:orderId', authorize('admin'), orderController.deleteOrder);

// Order status management
router.patch('/:orderId/status', authorize('admin', 'doctor', 'lab_technician', 'nurse'), orderController.updateOrderStatus);
router.post('/:orderId/collect-sample', authorize('lab_technician', 'nurse'), orderController.markSampleCollected);
router.post('/:orderId/complete', authorize('lab_technician'), orderController.completeOrder);
router.post('/:orderId/cancel', authorize('admin', 'doctor'), orderController.cancelOrder);

// Test management within orders
router.post('/:orderId/tests', authorize('admin', 'doctor', 'nurse', 'receptionist'), validateRequest, orderController.addTestToOrder);
router.delete('/:orderId/tests/:testId', authorize('admin', 'doctor', 'nurse', 'receptionist'), orderController.removeTestFromOrder);

// Payment management
router.patch('/:orderId/payment', authorize('admin', 'nurse', 'receptionist'), orderController.updateOrderPayment);

// Bulk operations
router.post('/bulk-create', authorize('admin', 'nurse', 'receptionist'), validateRequest, orderController.bulkCreateOrders);
router.patch('/bulk-status', authorize('admin', 'lab_technician'), validateRequest, orderController.bulkUpdateStatus);

// Patient specific orders
router.get('/patient/:patientId', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), orderController.getOrdersByPatient);
router.get('/doctor/:doctorId', authorize('admin', 'doctor'), orderController.getOrdersByDoctor);

// Pending tests for result entry
router.get('/:orderId/pending-tests', authorize('admin', 'lab_technician'), orderController.getPendingTests);

export default router;