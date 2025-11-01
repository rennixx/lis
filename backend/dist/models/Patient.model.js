"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patient = exports.PatientModel = void 0;
const patient_schema_1 = __importDefault(require("../schemas/patient.schema"));
exports.Patient = patient_schema_1.default;
class PatientModel {
    static async create(patientData) {
        return await patient_schema_1.default.create(patientData);
    }
    static async findById(id) {
        return await patient_schema_1.default.findById(id).populate('assignedDoctor', 'firstName lastName email');
    }
    static async findByMRN(mrn) {
        return await patient_schema_1.default.findOne({ mrn, isActive: true });
    }
    static async findByEmail(email) {
        return await patient_schema_1.default.findOne({ email: email.toLowerCase(), isActive: true });
    }
    static async findByPhone(phone) {
        return await patient_schema_1.default.findOne({
            $or: [
                { 'phones.number': phone },
                { 'emergencyContact.phone': phone }
            ],
            isActive: true
        });
    }
    static async findAll(filters = {}, options = {}) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, ...queryFilters } = filters;
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        let query = { isActive: true, ...queryFilters };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { mrn: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        return await patient_schema_1.default.find(query)
            .populate('assignedDoctor', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }
    static async updateById(id, updateData) {
        return await patient_schema_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('assignedDoctor', 'firstName lastName email');
    }
    static async deleteById(id) {
        return await patient_schema_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
    static async countDocuments(filters = {}) {
        let query = { isActive: true, ...filters };
        if (filters.search) {
            query.$or = [
                { firstName: { $regex: filters.search, $options: 'i' } },
                { lastName: { $regex: filters.search, $options: 'i' } },
                { mrn: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } }
            ];
            delete query.search;
        }
        return await patient_schema_1.default.countDocuments(query);
    }
    static async searchPatients(searchTerm, limit = 10) {
        const query = {
            isActive: true,
            $or: [
                { firstName: { $regex: searchTerm, $options: 'i' } },
                { lastName: { $regex: searchTerm, $options: 'i' } },
                { mrn: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { 'phones.number': { $regex: searchTerm, $options: 'i' } }
            ]
        };
        return await patient_schema_1.default.find(query)
            .limit(limit)
            .populate('assignedDoctor', 'firstName lastName email')
            .sort({ lastName: 1, firstName: 1 });
    }
    static async getPatientWithOrders(patientId) {
        return await patient_schema_1.default.findById(patientId)
            .populate({
            path: 'orders',
            match: { isActive: true },
            options: { sort: { createdAt: -1 } }
        })
            .populate('assignedDoctor', 'firstName lastName email');
    }
    static async getPatientWithResults(patientId, limit = 50) {
        return await patient_schema_1.default.findById(patientId)
            .populate({
            path: 'testHistory',
            match: { isActive: true },
            populate: {
                path: 'test',
                select: 'name code category'
            },
            options: {
                sort: { createdAt: -1 },
                limit
            }
        })
            .populate('assignedDoctor', 'firstName lastName email');
    }
    static async updatePatientInfo(patientId, info) {
        return await patient_schema_1.default.findByIdAndUpdate(patientId, {
            ...info,
            updatedAt: new Date()
        }, { new: true, runValidators: true });
    }
    static async addMedicalCondition(patientId, condition) {
        return await patient_schema_1.default.findByIdAndUpdate(patientId, {
            $addToSet: { medicalConditions: condition },
            updatedAt: new Date()
        }, { new: true });
    }
    static async removeMedicalCondition(patientId, condition) {
        return await patient_schema_1.default.findByIdAndUpdate(patientId, {
            $pull: { medicalConditions: condition },
            updatedAt: new Date()
        }, { new: true });
    }
    static async addMedication(patientId, medication) {
        return await patient_schema_1.default.findByIdAndUpdate(patientId, {
            $addToSet: { currentMedications: medication },
            updatedAt: new Date()
        }, { new: true });
    }
    static async removeMedication(patientId, medication) {
        return await patient_schema_1.default.findByIdAndUpdate(patientId, {
            $pull: { currentMedications: medication },
            updatedAt: new Date()
        }, { new: true });
    }
    static async addAllergy(patientId, allergy) {
        return await patient_schema_1.default.findByIdAndUpdate(patientId, {
            $addToSet: { allergies: allergy },
            updatedAt: new Date()
        }, { new: true });
    }
    static async removeAllergy(patientId, allergy) {
        return await patient_schema_1.default.findByIdAndUpdate(patientId, {
            $pull: { allergies: allergy },
            updatedAt: new Date()
        }, { new: true });
    }
    static async getPatientStatistics(dateRange) {
        const matchQuery = { isActive: true };
        if (dateRange) {
            matchQuery.createdAt = {
                $gte: dateRange.start,
                $lte: dateRange.end
            };
        }
        const statistics = await patient_schema_1.default.aggregate([
            { $match: matchQuery },
            {
                $facet: {
                    totalPatients: [{ $count: "count" }],
                    genderDistribution: [
                        {
                            $group: {
                                _id: "$gender",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    ageDistribution: [
                        {
                            $bucket: {
                                groupBy: "$age",
                                boundaries: [0, 18, 30, 45, 60, 100],
                                default: "unknown",
                                output: {
                                    count: { $sum: 1 }
                                }
                            }
                        }
                    ],
                    bloodTypeDistribution: [
                        {
                            $group: {
                                _id: "$bloodType",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    registrationTrend: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m", date: "$createdAt" }
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);
        return statistics[0];
    }
    static async getRecentPatients(days = 7, limit = 10) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return await patient_schema_1.default.find({
            isActive: true,
            createdAt: { $gte: cutoffDate }
        })
            .populate('assignedDoctor', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
}
exports.PatientModel = PatientModel;
