import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();
const patientController = new PatientController();

// Apply authentication to all routes
router.use(authenticate);

// Patient CRUD routes
router.post('/', authorize('admin', 'doctor', 'nurse', 'receptionist'), validateRequest, patientController.createPatient);
router.get('/', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), patientController.getAllPatients);
router.get('/search', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), patientController.searchPatients);
router.get('/statistics', authorize('admin', 'doctor'), patientController.getPatientStatistics);
router.get('/recent', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), patientController.getRecentPatients);
router.get('/:patientId', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), patientController.getPatientById);
router.get('/mrn/:mrn', authorize('admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'), patientController.getPatientByMRN);
router.put('/:patientId', authorize('admin', 'doctor', 'nurse', 'receptionist'), validateRequest, patientController.updatePatient);
router.delete('/:patientId', authorize('admin'), patientController.deletePatient);

// Patient specific routes
router.get('/:patientId/orders', authorize('admin', 'doctor', 'lab_technician', 'nurse'), patientController.getPatientWithOrders);
router.get('/:patientId/results', authorize('admin', 'doctor', 'lab_technician', 'nurse'), patientController.getPatientWithResults);

// Medical information management
router.post('/:patientId/medical-conditions', authorize('admin', 'doctor', 'nurse'), patientController.addMedicalCondition);
router.delete('/:patientId/medical-conditions', authorize('admin', 'doctor', 'nurse'), patientController.removeMedicalCondition);

router.post('/:patientId/medications', authorize('admin', 'doctor', 'nurse'), patientController.addMedication);
router.delete('/:patientId/medications', authorize('admin', 'doctor', 'nurse'), patientController.removeMedication);

router.post('/:patientId/allergies', authorize('admin', 'doctor', 'nurse'), patientController.addAllergy);
router.delete('/:patientId/allergies', authorize('admin', 'doctor', 'nurse'), patientController.removeAllergy);

export default router;