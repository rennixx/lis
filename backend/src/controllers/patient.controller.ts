import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { PatientZodSchema } from '../validators/patient.validator';
import { PatientService } from '../services/patient.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const patientService = new PatientService();

export class PatientController {
  // Create Patient
  createPatient = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = PatientZodSchema.create.parse(req.body);

    // @ts-ignore
    const patient = await patientService.createPatient(validatedData as any);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Patient created successfully', {
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
      })
    );
  });

  // Get All Patients
  getAllPatients = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      gender,
      bloodType,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      gender: gender as string,
      bloodType: bloodType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await patientService.getAllPatients(filters);

    return ApiResponse.success(res, 'Patients retrieved successfully', result.patients, 200, {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      });
  });

  // Get Patient by ID
  getPatientById = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;

    const patient = await patientService.getPatientById(patientId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patient retrieved successfully', {
        data: patient
      })
    );
  });

  // Get Patient by MRN
  getPatientByMRN = asyncHandler(async (req: Request, res: Response) => {
    const { mrn } = req.params;

    const patient = await patientService.getPatientByMRN(mrn);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patient retrieved successfully', {
        data: patient
      })
    );
  });

  // Update Patient
  updatePatient = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const validatedData = PatientZodSchema.update.parse(req.body);

    // Convert assignedDoctor string to ObjectId if present
    const processedData: any = { ...validatedData };
    if (processedData.assignedDoctor && typeof processedData.assignedDoctor === 'string') {
      processedData.assignedDoctor = new Types.ObjectId(processedData.assignedDoctor);
    }

    const updatedPatient = await patientService.updatePatient(patientId, processedData);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patient updated successfully', {
        data: updatedPatient
      })
    );
  });

  // Delete Patient (Soft Delete)
  deletePatient = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;

    await patientService.deletePatient(patientId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patient deleted successfully')
    );
  });

  // Search Patients
  searchPatients = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 10 } = req.query;

    if (!q) {
      // @ts-ignore
      throw new ApiError(400 as any, 'Search query is required');
    }

    const patients = await patientService.searchPatients(q as string, parseInt(limit as string));

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patients search completed', {
        data: patients
      })
    );
  });

  // Get Patient Statistics
  getPatientStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const statistics = await patientService.getPatientStatistics(dateRange);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patient statistics retrieved', {
        data: statistics
      })
    );
  });

  // Get Recent Patients
  getRecentPatients = asyncHandler(async (req: Request, res: Response) => {
    const { days = 7, limit = 10 } = req.query;

    const patients = await patientService.getRecentPatients(
      parseInt(days as string),
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Recent patients retrieved', {
        data: patients
      })
    );
  });

  // Get Patient with Orders
  getPatientWithOrders = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;

    const patient = await patientService.getPatientWithOrders(patientId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patient with orders retrieved', {
        data: patient
      })
    );
  });

  // Get Patient with Results
  getPatientWithResults = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;

    const patient = await patientService.getPatientWithResults(
      patientId,
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Patient with results retrieved', {
        data: patient
      })
    );
  });

  // Add Medical Condition
  addMedicalCondition = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { condition } = PatientZodSchema.addMedicalCondition.parse(req.body);

    const patient = await patientService.addMedicalCondition(patientId, condition);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Medical condition added successfully', {
        data: {
          id: patient.id,
          medicalConditions: patient.medicalHistory
        }
      })
    );
  });

  // Remove Medical Condition
  removeMedicalCondition = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { condition } = PatientZodSchema.removeMedicalCondition.parse(req.body);

    const patient = await patientService.removeMedicalCondition(patientId, condition);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Medical condition removed successfully', {
        data: {
          id: patient.id,
          medicalConditions: patient.medicalHistory
        }
      })
    );
  });

  // Add Medication
  addMedication = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { medication } = PatientZodSchema.addMedication.parse(req.body);

    const patient = await patientService.addMedication(patientId, medication);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Medication added successfully', {
        data: {
          id: patient.id,
          currentMedications: patient.medicalHistory[patient.medicalHistory.length - 1]?.medications || []
        }
      })
    );
  });

  // Remove Medication
  removeMedication = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { medication } = PatientZodSchema.removeMedication.parse(req.body);

    const patient = await patientService.removeMedication(patientId, medication);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Medication removed successfully', {
        data: {
          id: patient.id,
          currentMedications: patient.medicalHistory[patient.medicalHistory.length - 1]?.medications || []
        }
      })
    );
  });

  // Add Allergy
  addAllergy = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { allergy } = PatientZodSchema.addAllergy.parse(req.body);

    const patient = await patientService.addAllergy(patientId, allergy);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Allergy added successfully', {
        data: {
          id: patient.id,
          allergies: patient.allergies
        }
      })
    );
  });

  // Remove Allergy
  removeAllergy = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { allergy } = PatientZodSchema.removeAllergy.parse(req.body);

    const patient = await patientService.removeAllergy(patientId, allergy);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Allergy removed successfully', {
        data: {
          id: patient.id,
          allergies: patient.allergies
        }
      })
    );
  });
}