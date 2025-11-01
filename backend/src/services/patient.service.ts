import Patient from '../schemas/patient.schema';
import { IPatient } from '../types/models.types';
import { ApiError } from '../utils/ApiError';
import { IDGenerator } from '../utils/generateID';
import { Types } from 'mongoose';

export class PatientService {
  // Create Patient with transaction support
  async createPatient(data: Partial<IPatient>, session?: any) {
    try {
      const patientId = await IDGenerator.generatePatientId();

      // Convert assignedDoctor string to ObjectId if present
      const processedData = { ...data };
      if (processedData.assignedDoctor && typeof processedData.assignedDoctor === 'string') {
        processedData.assignedDoctor = new Types.ObjectId(processedData.assignedDoctor);
      }

      const patientData = {
        ...processedData,
        patientId,
        isActive: true
      };

      const patient = session
        ? await Patient.create([patientData], { session })
        : await Patient.create(patientData);

      return Array.isArray(patient) ? patient[0] : patient;
    } catch (error) {
      throw new ApiError(`Failed to create patient: ${error.message}`, 500);
    }
  }

  // Get all patients with filtering and pagination
  async getAllPatients(filters: any) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        gender,
        bloodType,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = filters;

      const queryFilters: any = { isActive: true };

      if (gender) queryFilters.gender = gender;
      if (bloodType) queryFilters.bloodGroup = bloodType;
      if (typeof isActive === 'boolean') queryFilters.isActive = isActive;

      // Search functionality
      if (search) {
        queryFilters.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } }
        ];
      }

      // Date range filtering
      if (startDate || endDate) {
        queryFilters.createdAt = {};
        if (startDate) queryFilters.createdAt.$gte = new Date(startDate);
        if (endDate) queryFilters.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [patients, total] = await Promise.all([
        Patient.find(queryFilters)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Patient.countDocuments(queryFilters)
      ]);

      return {
        patients,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      throw new ApiError(`Failed to get patients: ${error.message}`, 500);
    }
  }

  // Get patient by ID
  async getPatientById(patientId: string) {
    try {
      const patient = await Patient.findOne({ _id: patientId, isActive: true })
        // .populate('assignedDoctor', 'firstName lastName email');

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to get patient: ${error.message}`, 500);
    }
  }

  // Get patient by MRN
  async getPatientByMRN(mrn: string) {
    try {
      const patient = await Patient.findOne({ patientId: mrn, isActive: true })
        // .populate('assignedDoctor', 'firstName lastName email');

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to get patient: ${error.message}`, 500);
    }
  }

  // Get patient by email
  async getPatientByEmail(email: string) {
    try {
      const patient = await Patient.findOne({ email: email.toLowerCase(), isActive: true })
        // .populate('assignedDoctor', 'firstName lastName email');

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to get patient: ${error.message}`, 500);
    }
  }

  // Update patient
  async updatePatient(patientId: string, updateData: Partial<IPatient>) {
    try {
      // Convert assignedDoctor string to ObjectId if present
      const processedData = { ...updateData };
      if (processedData.assignedDoctor && typeof processedData.assignedDoctor === 'string') {
        processedData.assignedDoctor = new Types.ObjectId(processedData.assignedDoctor);
      }

      const patient = await Patient.findByIdAndUpdate(
        patientId,
        processedData,
        { new: true, runValidators: true }
      );

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to update patient: ${error.message}`, 500);
    }
  }

  // Delete patient (soft delete)
  async deletePatient(patientId: string) {
    try {
      const patient = await Patient.findByIdAndUpdate(
        patientId,
        { isActive: false },
        { new: true }
      );

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return true;
    } catch (error) {
      throw new ApiError(`Failed to delete patient: ${error.message}`, 500);
    }
  }

  // Search patients
  async searchPatients(query: string, filters: any = {}) {
    try {
      const searchQuery = query.trim();

      if (!searchQuery) {
        return [];
      }

      const searchFilters: any = {
        $and: [
          { isActive: true },
          {
            $or: [
              { firstName: { $regex: searchQuery, $options: 'i' } },
              { lastName: { $regex: searchQuery, $options: 'i' } },
              { email: { $regex: searchQuery, $options: 'i' } },
              { phone: { $regex: searchQuery, $options: 'i' } },
              { patientId: { $regex: searchQuery, $options: 'i' } }
            ]
          }
        ]
      };

      // Apply additional filters
      if (filters.gender) {
        searchFilters.$and.push({ gender: filters.gender });
      }

      if (filters.bloodGroup) {
        searchFilters.$and.push({ bloodGroup: filters.bloodGroup });
      }

      const patients = await Patient.find(searchFilters)
        .limit(20)
        // .populate('assignedDoctor', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return patients;
    } catch (error) {
      throw new ApiError(`Failed to search patients: ${error.message}`, 500);
    }
  }

  // Get patient statistics
  async getPatientStatistics(dateRange?: { start: Date; end: Date }) {
    try {
      let dateFilter = {};

      if (dateRange && dateRange.start && dateRange.end) {
        dateFilter = {
          createdAt: {
            $gte: dateRange.start,
            $lte: dateRange.end
          }
        };
      }

      const [total, active, recent] = await Promise.all([
        Patient.countDocuments(dateFilter),
        Patient.countDocuments({ ...dateFilter, isActive: true }),
        Patient.countDocuments({
          ...dateFilter,
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        total,
        active,
        recent,
        inactive: total - active
      };
    } catch (error) {
      throw new ApiError(`Failed to get patient statistics: ${error.message}`, 500);
    }
  }

  // Get recent patients
  async getRecentPatients(days: number = 7, limit: number = 10) {
    try {
      let queryFilter: any = { isActive: true };

      if (days) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        queryFilter = {
          isActive: true,
          createdAt: { $gte: cutoffDate }
        };
      }

      const patients = await Patient.find(queryFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        // .populate('assignedDoctor', 'firstName lastName email');

      return patients;
    } catch (error) {
      throw new ApiError(`Failed to get recent patients: ${error.message}`, 500);
    }
  }

  // Get patient with orders
  async getPatientWithOrders(patientId: string) {
    try {
      const patient = await Patient.findOne({ _id: patientId, isActive: true })
        .populate({
          path: 'testHistory',
          populate: {
            path: 'order',
            model: 'Order'
          }
        })
        // .populate('assignedDoctor', 'firstName lastName email');

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to get patient with orders: ${error.message}`, 500);
    }
  }

  // Get patient with results
  async getPatientWithResults(patientId: string, limit?: number) {
    try {
      let pipeline: any[] = [
        { $match: { _id: new Types.ObjectId(patientId), isActive: true } },
        {
          $lookup: {
            from: 'orders',
            localField: 'testHistory',
            foreignField: '_id',
            as: 'orders'
          }
        },
        {
          $lookup: {
            from: 'results',
            localField: 'orders._id',
            foreignField: 'order',
            as: 'results'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedDoctor',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        {
          $unwind: {
            path: '$doctor',
            preserveNullAndEmptyArrays: true
          }
        }
      ];

      if (limit) {
        pipeline.push({
          $limit: limit
        });
      }

      const patients = await Patient.aggregate(pipeline);

      if (patients.length === 0) {
        throw new ApiError('Patient not found', 404);
      }

      return patients[0];
    } catch (error) {
      throw new ApiError(`Failed to get patient with results: ${error.message}`, 500);
    }
  }

  // Add medical condition
  async addMedicalCondition(patientId: string, condition: any) {
    try {
      const patient = await Patient.findByIdAndUpdate(
        patientId,
        {
          $push: {
            medicalHistory: {
              ...condition,
              diagnosisDate: condition.diagnosisDate || new Date()
            }
          }
        },
        { new: true, runValidators: true }
      );

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to add medical condition: ${error.message}`, 500);
    }
  }

  // Remove medical condition
  async removeMedicalCondition(patientId: string, conditionToRemove: any) {
    try {
      const patient = await Patient.findById(patientId);

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      // If conditionToRemove is a number, treat as index
      // If it's an object with condition text, find and remove by matching
      if (typeof conditionToRemove === 'number') {
        patient.medicalHistory.splice(conditionToRemove, 1);
      } else if (typeof conditionToRemove === 'object' && conditionToRemove.condition) {
        patient.medicalHistory = patient.medicalHistory.filter(
          med => med.condition !== conditionToRemove.condition
        );
      } else if (typeof conditionToRemove === 'string') {
        // Remove by condition name
        patient.medicalHistory = patient.medicalHistory.filter(
          med => med.condition !== conditionToRemove
        );
      }

      await patient.save();
      return patient;
    } catch (error) {
      throw new ApiError(`Failed to remove medical condition: ${error.message}`, 500);
    }
  }

  // Add medication
  async addMedication(patientId: string, medication: string) {
    try {
      const patient = await Patient.findById(patientId);

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      // Add to the most recent medical condition or create a new one
      if (patient.medicalHistory.length === 0) {
        patient.medicalHistory.push({
          condition: 'Medication Management',
          diagnosis: 'Ongoing medication',
          diagnosisDate: new Date(),
          medications: [medication]
        });
      } else {
        const latestCondition = patient.medicalHistory[patient.medicalHistory.length - 1];
        if (!latestCondition.medications.includes(medication)) {
          latestCondition.medications.push(medication);
        }
      }

      await patient.save();
      return patient;
    } catch (error) {
      throw new ApiError(`Failed to add medication: ${error.message}`, 500);
    }
  }

  // Remove medication
  async removeMedication(patientId: string, medication: string) {
    try {
      const patient = await Patient.findById(patientId);

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      // Remove medication from all medical conditions
      patient.medicalHistory.forEach(condition => {
        condition.medications = condition.medications.filter(med => med !== medication);
      });

      await patient.save();
      return patient;
    } catch (error) {
      throw new ApiError(`Failed to remove medication: ${error.message}`, 500);
    }
  }

  // Add allergy
  async addAllergy(patientId: string, allergy: string) {
    try {
      const patient = await Patient.findByIdAndUpdate(
        patientId,
        { $addToSet: { allergies: allergy } },
        { new: true, runValidators: true }
      );

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to add allergy: ${error.message}`, 500);
    }
  }

  // Remove allergy
  async removeAllergy(patientId: string, allergy: string) {
    try {
      const patient = await Patient.findByIdAndUpdate(
        patientId,
        { $pull: { allergies: allergy } },
        { new: true }
      );

      if (!patient) {
        throw new ApiError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      throw new ApiError(`Failed to remove allergy: ${error.message}`, 500);
    }
  }
}