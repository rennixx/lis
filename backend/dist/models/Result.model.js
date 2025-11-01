"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultModel = void 0;
const result_schema_1 = require("../schemas/result.schema");
class ResultModel {
    static async create(resultData) {
        return await result_schema_1.Result.create(resultData);
    }
    static async findById(id) {
        return await result_schema_1.Result.findById(id)
            .populate('order', 'orderNumber')
            .populate('test', 'name code category unit')
            .populate('patient', 'firstName lastName mrn')
            .populate('enteredBy', 'firstName lastName email')
            .populate('verifiedBy', 'firstName lastName email');
    }
    static async findAll(filters = {}, options = {}) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, patientId, testId, orderId, enteredBy, verifiedBy, criticalValue, isAbnormal, startDate, endDate, ...queryFilters } = filters;
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        let query = { isActive: true, ...queryFilters };
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { testName: { $regex: search, $options: 'i' } },
                { testCode: { $regex: search, $options: 'i' } },
                { patientName: { $regex: search, $options: 'i' } },
                { patientMRN: { $regex: search, $options: 'i' } }
            ];
        }
        if (status)
            query.status = status;
        if (patientId)
            query.patient = patientId;
        if (testId)
            query.test = testId;
        if (orderId)
            query.order = orderId;
        if (enteredBy)
            query.enteredBy = enteredBy;
        if (verifiedBy)
            query.verifiedBy = verifiedBy;
        if (criticalValue !== undefined)
            query.criticalValue = criticalValue;
        if (isAbnormal !== undefined)
            query.isAbnormal = isAbnormal;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        return await result_schema_1.Result.find(query)
            .populate('order', 'orderNumber')
            .populate('test', 'name code category unit')
            .populate('patient', 'firstName lastName mrn')
            .populate('enteredBy', 'firstName lastName email')
            .populate('verifiedBy', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }
    static async updateById(id, updateData) {
        return await result_schema_1.Result.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('order', 'orderNumber')
            .populate('test', 'name code category unit')
            .populate('patient', 'firstName lastName mrn')
            .populate('enteredBy', 'firstName lastName email')
            .populate('verifiedBy', 'firstName lastName email');
    }
    static async deleteById(id) {
        return await result_schema_1.Result.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
    static async countDocuments(filters = {}) {
        let query = { isActive: true, ...filters };
        if (filters.search) {
            query.$or = [
                { orderNumber: { $regex: filters.search, $options: 'i' } },
                { testName: { $regex: filters.search, $options: 'i' } },
                { patientName: { $regex: filters.search, $options: 'i' } }
            ];
            delete query.search;
        }
        return await result_schema_1.Result.countDocuments(query);
    }
    static async createResult(resultData) {
        if (resultData.valueType === 'number' && resultData.normalRange) {
            const value = parseFloat(resultData.value);
            const { min, max } = resultData.normalRange;
            let isAbnormal = false;
            if (min !== undefined && value < min)
                isAbnormal = true;
            if (max !== undefined && value > max)
                isAbnormal = true;
            resultData.isAbnormal = isAbnormal;
        }
        return await result_schema_1.Result.create(resultData);
    }
    static async updateResultValue(resultId, value, enteredBy) {
        const updateData = { value };
        const result = await result_schema_1.Result.findById(resultId).populate('test');
        if (result && result.test) {
            const test = result.test;
            if (test.normalRange) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    const { min, max } = test.normalRange;
                    let isAbnormal = false;
                    if (min !== undefined && numValue < min)
                        isAbnormal = true;
                    if (max !== undefined && numValue > max)
                        isAbnormal = true;
                    updateData.isAbnormal = isAbnormal;
                }
            }
        }
        updateData.status = 'completed';
        updateData.analysisDate = new Date();
        return await result_schema_1.Result.findByIdAndUpdate(resultId, updateData, { new: true });
    }
    static async verifyResult(resultId, verifiedBy, verifiedByUser) {
        return await result_schema_1.Result.findByIdAndUpdate(resultId, {
            status: 'verified',
            verifiedBy,
            verifiedByUser,
            verificationDate: new Date()
        }, { new: true });
    }
    static async rejectResult(resultId, rejectedBy, reason) {
        return await result_schema_1.Result.findByIdAndUpdate(resultId, {
            status: 'rejected',
            rejectedBy,
            rejectedReason: reason
        }, { new: true });
    }
    static async markResultAsCritical(resultId) {
        return await result_schema_1.Result.findByIdAndUpdate(resultId, {
            criticalValue: true,
            criticalValueNotifiedAt: new Date()
        }, { new: true });
    }
    static async getResultsByOrder(orderId) {
        return await result_schema_1.Result.find({
            order: orderId,
            isActive: true
        })
            .populate('test', 'name code category unit')
            .populate('enteredBy', 'firstName lastName email')
            .populate('verifiedBy', 'firstName lastName email')
            .sort({ createdAt: 1 });
    }
    static async getResultsByPatient(patientId, limit = 100) {
        return await result_schema_1.Result.find({
            patient: patientId,
            isActive: true
        })
            .populate({
            path: 'order',
            select: 'orderNumber createdAt'
        })
            .populate('test', 'name code category unit')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getResultsByTest(testId, limit = 50) {
        return await result_schema_1.Result.find({
            test: testId,
            isActive: true
        })
            .populate({
            path: 'patient',
            select: 'firstName lastName mrn'
        })
            .populate({
            path: 'order',
            select: 'orderNumber createdAt'
        })
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getResultsByStatus(status, limit = 50) {
        return await result_schema_1.Result.find({
            status: status,
            isActive: true
        })
            .populate({
            path: 'patient',
            select: 'firstName lastName mrn'
        })
            .populate({
            path: 'order',
            select: 'orderNumber'
        })
            .populate('test', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getCriticalResults() {
        return await result_schema_1.Result.find({
            criticalValue: true,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn phone')
            .populate('order', 'orderNumber')
            .populate('test', 'name code category')
            .populate('enteredBy', 'firstName lastName email')
            .sort({ criticalValueNotifiedAt: -1 });
    }
    static async getAbnormalResults(limit = 50) {
        return await result_schema_1.Result.find({
            isAbnormal: true,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('order', 'orderNumber')
            .populate('test', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getOverdueResults() {
        return await result_schema_1.Result.find({
            status: { $in: ['pending', 'in_progress'] },
            isActive: true
        })
            .populate('order', 'orderNumber')
            .populate('test', 'name code turnaroundTime')
            .populate('patient', 'firstName lastName mrn')
            .sort({ createdAt: 1 });
    }
    static async getResultsByEnteredBy(enteredBy, limit = 50) {
        return await result_schema_1.Result.find({
            enteredBy: enteredBy,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('order', 'orderNumber')
            .populate('test', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getResultsByVerifiedBy(verifiedBy, limit = 50) {
        return await result_schema_1.Result.find({
            verifiedBy: verifiedBy,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('order', 'orderNumber')
            .populate('test', 'name code category')
            .sort({ verificationDate: -1 })
            .limit(limit);
    }
    static async getResultStatistics(dateRange) {
        const matchQuery = { isActive: true };
        if (dateRange) {
            matchQuery.createdAt = {
                $gte: dateRange.start,
                $lte: dateRange.end
            };
        }
        const statistics = await result_schema_1.Result.aggregate([
            { $match: matchQuery },
            {
                $facet: {
                    totalResults: [{ $count: "count" }],
                    statusDistribution: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    criticalResults: [
                        {
                            $match: { criticalValue: true }
                        },
                        { $count: "count" }
                    ],
                    abnormalResults: [
                        {
                            $match: { isAbnormal: true }
                        },
                        { $count: "count" }
                    ],
                    valueTypeDistribution: [
                        {
                            $group: {
                                _id: "$valueType",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    dailyTrend: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                                },
                                count: { $sum: 1 },
                                criticalCount: {
                                    $sum: { $cond: ["$criticalValue", 1, 0] }
                                },
                                abnormalCount: {
                                    $sum: { $cond: ["$isAbnormal", 1, 0] }
                                }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    turnaroundTime: [
                        {
                            $group: {
                                _id: null,
                                averageTurnaroundTime: { $avg: "$turnaroundTime" },
                                minTurnaroundTime: { $min: "$turnaroundTime" },
                                maxTurnaroundTime: { $max: "$turnaroundTime" }
                            }
                        }
                    ]
                }
            }
        ]);
        return statistics[0];
    }
    static async searchResults(searchTerm, limit = 20) {
        const query = {
            isActive: true,
            $or: [
                { orderNumber: { $regex: searchTerm, $options: 'i' } },
                { testName: { $regex: searchTerm, $options: 'i' } },
                { testCode: { $regex: searchTerm, $options: 'i' } },
                { patientName: { $regex: searchTerm, $options: 'i' } },
                { patientMRN: { $regex: searchTerm, $options: 'i' } },
                { comments: { $regex: searchTerm, $options: 'i' } }
            ]
        };
        return await result_schema_1.Result.find(query)
            .populate('patient', 'firstName lastName mrn')
            .populate('order', 'orderNumber')
            .populate('test', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getResultsForReview(limit = 20) {
        return await result_schema_1.Result.find({
            status: { $in: ['completed', 'requires_review'] },
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn phone')
            .populate('order', 'orderNumber')
            .populate('test', 'name code category unit')
            .populate('enteredBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async bulkVerifyResults(resultIds, verifiedBy, verifiedByUser) {
        const updateData = {
            status: 'verified',
            verifiedBy,
            verifiedByUser,
            verificationDate: new Date()
        };
        return await result_schema_1.Result.updateMany({
            _id: { $in: resultIds },
            isActive: true
        }, updateData);
    }
    static async bulkRejectResults(resultIds, rejectedBy, reason) {
        const updateData = {
            status: 'rejected',
            rejectedBy,
            rejectedReason: reason
        };
        return await result_schema_1.Result.updateMany({
            _id: { $in: resultIds },
            isActive: true
        }, updateData);
    }
    static async addCommentToResult(resultId, comment) {
        return await result_schema_1.Result.findByIdAndUpdate(resultId, {
            comments: comment,
            updatedAt: new Date()
        }, { new: true });
    }
    static async addNotesToResult(resultId, notes) {
        return await result_schema_1.Result.findByIdAndUpdate(resultId, {
            notes,
            updatedAt: new Date()
        }, { new: true });
    }
    static async getResultWithAttachments(resultId) {
        return await result_schema_1.Result.findById(resultId)
            .populate('attachments')
            .populate('order', 'orderNumber')
            .populate('test', 'name code category')
            .populate('patient', 'firstName lastName mrn');
    }
}
exports.ResultModel = ResultModel;
