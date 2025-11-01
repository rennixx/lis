"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const patient_schema_1 = __importDefault(require("../schemas/patient.schema"));
const ApiError_1 = require("../utils/ApiError");
const generateID_1 = require("../utils/generateID");
const mongoose_1 = require("mongoose");
class PatientService {
    async createPatient(data, session) {
        try {
            const patientId = await generateID_1.IDGenerator.generatePatientId();
            const processedData = { ...data };
            if (processedData.assignedDoctor && typeof processedData.assignedDoctor === 'string') {
                processedData.assignedDoctor = new mongoose_1.Types.ObjectId(processedData.assignedDoctor);
            }
            const patientData = {
                ...processedData,
                patientId,
                isActive: true
            };
            const patient = session
                ? await patient_schema_1.default.create([patientData], { session })
                : await patient_schema_1.default.create(patientData);
            return Array.isArray(patient) ? patient[0] : patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to create patient: ${error.message}`, 500);
        }
    }
    async getAllPatients(filters) {
        try {
            const { page = 1, limit = 10, search, gender, bloodType, isActive, sortBy = 'createdAt', sortOrder = 'desc', startDate, endDate } = filters;
            const queryFilters = { isActive: true };
            if (gender)
                queryFilters.gender = gender;
            if (bloodType)
                queryFilters.bloodGroup = bloodType;
            if (typeof isActive === 'boolean')
                queryFilters.isActive = isActive;
            if (search) {
                queryFilters.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { patientId: { $regex: search, $options: 'i' } }
                ];
            }
            if (startDate || endDate) {
                queryFilters.createdAt = {};
                if (startDate)
                    queryFilters.createdAt.$gte = new Date(startDate);
                if (endDate)
                    queryFilters.createdAt.$lte = new Date(endDate);
            }
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const [patients, total] = await Promise.all([
                patient_schema_1.default.find(queryFilters)
                    .sort(sort)
                    .skip(skip)
                    .limit(parseInt(limit)),
                patient_schema_1.default.countDocuments(queryFilters)
            ]);
            return {
                patients,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            };
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get patients: ${error.message}`, 500);
        }
    }
    async getPatientById(patientId) {
        try {
            const patient = await patient_schema_1.default.findOne({ _id: patientId, isActive: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get patient: ${error.message}`, 500);
        }
    }
    async getPatientByMRN(mrn) {
        try {
            const patient = await patient_schema_1.default.findOne({ patientId: mrn, isActive: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get patient: ${error.message}`, 500);
        }
    }
    async getPatientByEmail(email) {
        try {
            const patient = await patient_schema_1.default.findOne({ email: email.toLowerCase(), isActive: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get patient: ${error.message}`, 500);
        }
    }
    async updatePatient(patientId, updateData) {
        try {
            const processedData = { ...updateData };
            if (processedData.assignedDoctor && typeof processedData.assignedDoctor === 'string') {
                processedData.assignedDoctor = new mongoose_1.Types.ObjectId(processedData.assignedDoctor);
            }
            const patient = await patient_schema_1.default.findByIdAndUpdate(patientId, processedData, { new: true, runValidators: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to update patient: ${error.message}`, 500);
        }
    }
    async deletePatient(patientId) {
        try {
            const patient = await patient_schema_1.default.findByIdAndUpdate(patientId, { isActive: false }, { new: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return true;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to delete patient: ${error.message}`, 500);
        }
    }
    async searchPatients(query, filters = {}) {
        try {
            const searchQuery = query.trim();
            if (!searchQuery) {
                return [];
            }
            const searchFilters = {
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
            if (filters.gender) {
                searchFilters.$and.push({ gender: filters.gender });
            }
            if (filters.bloodGroup) {
                searchFilters.$and.push({ bloodGroup: filters.bloodGroup });
            }
            const patients = await patient_schema_1.default.find(searchFilters)
                .limit(20)
                .sort({ createdAt: -1 });
            return patients;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to search patients: ${error.message}`, 500);
        }
    }
    async getPatientStatistics(dateRange) {
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
                patient_schema_1.default.countDocuments(dateFilter),
                patient_schema_1.default.countDocuments({ ...dateFilter, isActive: true }),
                patient_schema_1.default.countDocuments({
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
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get patient statistics: ${error.message}`, 500);
        }
    }
    async getRecentPatients(days = 7, limit = 10) {
        try {
            let queryFilter = { isActive: true };
            if (days) {
                const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                queryFilter = {
                    isActive: true,
                    createdAt: { $gte: cutoffDate }
                };
            }
            const patients = await patient_schema_1.default.find(queryFilter)
                .sort({ createdAt: -1 })
                .limit(limit);
            return patients;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get recent patients: ${error.message}`, 500);
        }
    }
    async getPatientWithOrders(patientId) {
        try {
            const patient = await patient_schema_1.default.findOne({ _id: patientId, isActive: true })
                .populate({
                path: 'testHistory',
                populate: {
                    path: 'order',
                    model: 'Order'
                }
            });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get patient with orders: ${error.message}`, 500);
        }
    }
    async getPatientWithResults(patientId, limit) {
        try {
            let pipeline = [
                { $match: { _id: new mongoose_1.Types.ObjectId(patientId), isActive: true } },
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
            const patients = await patient_schema_1.default.aggregate(pipeline);
            if (patients.length === 0) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patients[0];
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to get patient with results: ${error.message}`, 500);
        }
    }
    async addMedicalCondition(patientId, condition) {
        try {
            const patient = await patient_schema_1.default.findByIdAndUpdate(patientId, {
                $push: {
                    medicalHistory: {
                        ...condition,
                        diagnosisDate: condition.diagnosisDate || new Date()
                    }
                }
            }, { new: true, runValidators: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to add medical condition: ${error.message}`, 500);
        }
    }
    async removeMedicalCondition(patientId, conditionToRemove) {
        try {
            const patient = await patient_schema_1.default.findById(patientId);
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            if (typeof conditionToRemove === 'number') {
                patient.medicalHistory.splice(conditionToRemove, 1);
            }
            else if (typeof conditionToRemove === 'object' && conditionToRemove.condition) {
                patient.medicalHistory = patient.medicalHistory.filter(med => med.condition !== conditionToRemove.condition);
            }
            else if (typeof conditionToRemove === 'string') {
                patient.medicalHistory = patient.medicalHistory.filter(med => med.condition !== conditionToRemove);
            }
            await patient.save();
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to remove medical condition: ${error.message}`, 500);
        }
    }
    async addMedication(patientId, medication) {
        try {
            const patient = await patient_schema_1.default.findById(patientId);
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            if (patient.medicalHistory.length === 0) {
                patient.medicalHistory.push({
                    condition: 'Medication Management',
                    diagnosis: 'Ongoing medication',
                    diagnosisDate: new Date(),
                    medications: [medication]
                });
            }
            else {
                const latestCondition = patient.medicalHistory[patient.medicalHistory.length - 1];
                if (!latestCondition.medications.includes(medication)) {
                    latestCondition.medications.push(medication);
                }
            }
            await patient.save();
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to add medication: ${error.message}`, 500);
        }
    }
    async removeMedication(patientId, medication) {
        try {
            const patient = await patient_schema_1.default.findById(patientId);
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            patient.medicalHistory.forEach(condition => {
                condition.medications = condition.medications.filter(med => med !== medication);
            });
            await patient.save();
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to remove medication: ${error.message}`, 500);
        }
    }
    async addAllergy(patientId, allergy) {
        try {
            const patient = await patient_schema_1.default.findByIdAndUpdate(patientId, { $addToSet: { allergies: allergy } }, { new: true, runValidators: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to add allergy: ${error.message}`, 500);
        }
    }
    async removeAllergy(patientId, allergy) {
        try {
            const patient = await patient_schema_1.default.findByIdAndUpdate(patientId, { $pull: { allergies: allergy } }, { new: true });
            if (!patient) {
                throw new ApiError_1.ApiError('Patient not found', 404);
            }
            return patient;
        }
        catch (error) {
            throw new ApiError_1.ApiError(`Failed to remove allergy: ${error.message}`, 500);
        }
    }
}
exports.PatientService = PatientService;
