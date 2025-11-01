"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const mongoose_1 = require("mongoose");
const patient_validator_1 = require("../validators/patient.validator");
const patient_service_1 = require("../services/patient.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const patientService = new patient_service_1.PatientService();
class PatientController {
    constructor() {
        this.createPatient = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const validatedData = patient_validator_1.PatientZodSchema.create.parse(req.body);
            const patient = await patientService.createPatient(validatedData);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Patient created successfully', {
                data: {
                    id: patient._id,
                    patientId: patient.patientId,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    email: patient.email,
                    phone: patient.phone,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    bloodGroup: patient.bloodGroup,
                    isActive: patient.isActive,
                    createdAt: patient.createdAt
                }
            }));
        });
        this.getAllPatients = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, search, gender, bloodType, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                gender: gender,
                bloodType: bloodType,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await patientService.getAllPatients(filters);
            return ApiResponse_1.ApiResponse.success(res, 'Patients retrieved successfully', result.patients, 200, {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
                pages: Math.ceil(result.total / filters.limit)
            });
        });
        this.getPatientById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const patient = await patientService.getPatientById(patientId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patient retrieved successfully', {
                data: patient
            }));
        });
        this.getPatientByMRN = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { mrn } = req.params;
            const patient = await patientService.getPatientByMRN(mrn);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patient retrieved successfully', {
                data: patient
            }));
        });
        this.updatePatient = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const validatedData = patient_validator_1.PatientZodSchema.update.parse(req.body);
            const processedData = { ...validatedData };
            if (processedData.assignedDoctor && typeof processedData.assignedDoctor === 'string') {
                processedData.assignedDoctor = new mongoose_1.Types.ObjectId(processedData.assignedDoctor);
            }
            const updatedPatient = await patientService.updatePatient(patientId, processedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patient updated successfully', {
                data: updatedPatient
            }));
        });
        this.deletePatient = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            await patientService.deletePatient(patientId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patient deleted successfully'));
        });
        this.searchPatients = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { q, limit = 10 } = req.query;
            if (!q) {
                throw new ApiError_1.ApiError(400, 'Search query is required');
            }
            const patients = await patientService.searchPatients(q, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patients search completed', {
                data: patients
            }));
        });
        this.getPatientStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startDate, endDate } = req.query;
            let dateRange;
            if (startDate && endDate) {
                dateRange = {
                    start: new Date(startDate),
                    end: new Date(endDate)
                };
            }
            const statistics = await patientService.getPatientStatistics(dateRange);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patient statistics retrieved', {
                data: statistics
            }));
        });
        this.getRecentPatients = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { days = 7, limit = 10 } = req.query;
            const patients = await patientService.getRecentPatients(parseInt(days), parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Recent patients retrieved', {
                data: patients
            }));
        });
        this.getPatientWithOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const patient = await patientService.getPatientWithOrders(patientId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patient with orders retrieved', {
                data: patient
            }));
        });
        this.getPatientWithResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { limit = 50 } = req.query;
            const patient = await patientService.getPatientWithResults(patientId, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Patient with results retrieved', {
                data: patient
            }));
        });
        this.addMedicalCondition = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { condition } = patient_validator_1.PatientZodSchema.addMedicalCondition.parse(req.body);
            const patient = await patientService.addMedicalCondition(patientId, condition);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Medical condition added successfully', {
                data: {
                    id: patient.id,
                    medicalConditions: patient.medicalHistory
                }
            }));
        });
        this.removeMedicalCondition = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { condition } = patient_validator_1.PatientZodSchema.removeMedicalCondition.parse(req.body);
            const patient = await patientService.removeMedicalCondition(patientId, condition);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Medical condition removed successfully', {
                data: {
                    id: patient.id,
                    medicalConditions: patient.medicalHistory
                }
            }));
        });
        this.addMedication = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { medication } = patient_validator_1.PatientZodSchema.addMedication.parse(req.body);
            const patient = await patientService.addMedication(patientId, medication);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Medication added successfully', {
                data: {
                    id: patient.id,
                    currentMedications: patient.medicalHistory[patient.medicalHistory.length - 1]?.medications || []
                }
            }));
        });
        this.removeMedication = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { medication } = patient_validator_1.PatientZodSchema.removeMedication.parse(req.body);
            const patient = await patientService.removeMedication(patientId, medication);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Medication removed successfully', {
                data: {
                    id: patient.id,
                    currentMedications: patient.medicalHistory[patient.medicalHistory.length - 1]?.medications || []
                }
            }));
        });
        this.addAllergy = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { allergy } = patient_validator_1.PatientZodSchema.addAllergy.parse(req.body);
            const patient = await patientService.addAllergy(patientId, allergy);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Allergy added successfully', {
                data: {
                    id: patient.id,
                    allergies: patient.allergies
                }
            }));
        });
        this.removeAllergy = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { allergy } = patient_validator_1.PatientZodSchema.removeAllergy.parse(req.body);
            const patient = await patientService.removeAllergy(patientId, allergy);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Allergy removed successfully', {
                data: {
                    id: patient.id,
                    allergies: patient.allergies
                }
            }));
        });
    }
}
exports.PatientController = PatientController;
