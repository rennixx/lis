"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultService = void 0;
const result_schema_1 = require("../schemas/result.schema");
const order_schema_1 = require("../schemas/order.schema");
const test_schema_1 = __importDefault(require("../schemas/test.schema"));
const ApiError_1 = require("../utils/ApiError");
const mongoose_1 = require("mongoose");
const mongoose = require('mongoose');
class ResultService {
    async createResult(data) {
        try {
            const order = await order_schema_1.Order.findById(data.orderId);
            if (!order) {
                throw new ApiError_1.ApiError('Order not found', 404);
            }
            const test = await test_schema_1.default.findById(data.testId);
            if (!test) {
                throw new ApiError_1.ApiError('Test not found', 404);
            }
            const existingResult = await result_schema_1.Result.findOne({
                order: data.orderId,
                test: data.testId,
                isActive: true
            });
            if (existingResult) {
                throw new ApiError_1.ApiError('Result already exists for this order and test', 400);
            }
            const resultData = {
                order: new mongoose_1.Types.ObjectId(data.orderId),
                test: new mongoose_1.Types.ObjectId(data.testId),
                patient: order.patient,
                enteredBy: new mongoose_1.Types.ObjectId(data.enteredBy),
                value: data.value,
                valueType: data.valueType || 'number',
                status: 'pending',
                notes: data.notes,
                equipment: data.equipment,
                method: data.method,
                specimen: data.specimen,
                specimenType: data.specimenType
            };
            const result = await result_schema_1.Result.create(resultData);
            return result;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to create result', 500);
        }
    }
    async createBulkResults(resultsData, enteredBy) {
        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            const createdResults = [];
            for (const resultData of resultsData) {
                const order = await order_schema_1.Order.findById(resultData.orderId).session(session);
                if (!order) {
                    throw new ApiError_1.ApiError(`Order ${resultData.orderId} not found`, 404);
                }
                const test = await test_schema_1.default.findById(resultData.testId).session(session);
                if (!test) {
                    throw new ApiError_1.ApiError(`Test ${resultData.testId} not found`, 404);
                }
                const existingResult = await result_schema_1.Result.findOne({
                    order: resultData.orderId,
                    test: resultData.testId,
                    isActive: true
                }).session(session);
                if (existingResult) {
                    throw new ApiError_1.ApiError(`Result already exists for order ${resultData.orderId} and test ${resultData.testId}`, 400);
                }
                const newResultData = {
                    order: new mongoose_1.Types.ObjectId(resultData.orderId),
                    test: new mongoose_1.Types.ObjectId(resultData.testId),
                    patient: order.patient,
                    enteredBy: new mongoose_1.Types.ObjectId(enteredBy),
                    value: resultData.value,
                    valueType: resultData.valueType || 'number',
                    status: 'pending',
                    notes: resultData.notes,
                    equipment: resultData.equipment,
                    method: resultData.method,
                    specimen: resultData.specimen,
                    specimenType: resultData.specimenType
                };
                const result = await result_schema_1.Result.create([newResultData], { session });
                createdResults.push(result[0]);
            }
            await session.commitTransaction();
            session.endSession();
            return createdResults;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to create bulk results', 500);
        }
    }
    async getAllResults(filters) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, patientId, testId, orderId, criticalValue, isAbnormal, startDate, endDate } = filters;
            const query = { isActive: true };
            if (status)
                query.status = status;
            if (patientId)
                query.patient = patientId;
            if (testId)
                query.test = testId;
            if (orderId)
                query.order = orderId;
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
            if (search) {
                query.$or = [
                    { testName: { $regex: search, $options: 'i' } },
                    { testCode: { $regex: search, $options: 'i' } },
                    { patientName: { $regex: search, $options: 'i' } },
                    { patientMRN: { $regex: search, $options: 'i' } }
                ];
            }
            const skip = (page - 1) * limit;
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            console.log('🔍 [RESULT SERVICE] Query:', query);
            console.log('🔍 [RESULT SERVICE] Sort:', sort);
            console.log('🔍 [RESULT SERVICE] Skip/Limit:', skip, limit);
            try {
                console.log('🔍 [RESULT SERVICE] Starting Mongoose find...');
                let results;
                try {
                    const nativeResults = await mongoose.connection.db.collection('results').find(query)
                        .sort(sort)
                        .skip(skip)
                        .limit(limit)
                        .toArray();
                    console.log('🔍 [RESULT SERVICE] Native query results:', nativeResults.length);
                    if (nativeResults.length > 0) {
                        results = nativeResults.map(doc => {
                            const mongooseDoc = new result_schema_1.Result();
                            mongooseDoc.set(doc);
                            return mongooseDoc;
                        });
                        console.log('🔍 [RESULT SERVICE] Using native query results, converted to Mongoose docs');
                    }
                    else {
                        results = await result_schema_1.Result.find(query)
                            .sort(sort)
                            .skip(skip)
                            .limit(limit);
                        console.log('🔍 [RESULT SERVICE] Mongoose query results:', results.length);
                    }
                }
                catch (nativeError) {
                    console.warn('🔍 [RESULT SERVICE] Native query failed, trying Mongoose:', nativeError.message);
                    results = await result_schema_1.Result.find(query)
                        .sort(sort)
                        .skip(skip)
                        .limit(limit);
                    console.log('🔍 [RESULT SERVICE] Mongoose fallback query results:', results.length);
                }
                console.log('🔍 [RESULT SERVICE] Mongoose find completed');
                console.log('🔍 [RESULT SERVICE] Results found:', results.length);
                const total = await result_schema_1.Result.countDocuments(query);
                console.log('🔍 [RESULT SERVICE] Total count:', total);
                console.log('🔍 [RESULT SERVICE] First result data:', results.length > 0 ? JSON.stringify(results[0], null, 2) : 'No results');
                const nativeQuery = await mongoose.connection.db.collection('results').find(query).toArray();
                console.log('🔍 [RESULT SERVICE] Native query results:', nativeQuery.length);
                if (results.length !== nativeQuery.length) {
                    console.log('🔍 [RESULT SERVICE] MISMATCH: Mongoose results:', results.length, 'Native results:', nativeQuery.length);
                    console.log('🔍 [RESULT SERVICE] Mongoose issue detected!');
                }
                return { results, total };
            }
            catch (error) {
                console.error('🔍 [RESULT SERVICE] Mongoose query error:', error);
                throw error;
            }
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get results', 500);
        }
    }
    async getResultById(id) {
        try {
            const result = await result_schema_1.Result.findById(id)
                .populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('patient', 'firstName lastName mrn')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email');
            if (!result) {
                throw new ApiError_1.ApiError('Result not found', 404);
            }
            return result;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to get result', 500);
        }
    }
    async updateResult(id, data) {
        try {
            const result = await result_schema_1.Result.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('patient', 'firstName lastName mrn')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email');
            if (!result) {
                throw new ApiError_1.ApiError('Result not found', 404);
            }
            return result;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to update result', 500);
        }
    }
    async updateResultValue(id, value, userId) {
        try {
            const updateData = { value };
            const result = await result_schema_1.Result.findById(id).populate('test');
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
            const updatedResult = await result_schema_1.Result.findByIdAndUpdate(id, updateData, { new: true }).populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('patient', 'firstName lastName mrn')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email');
            if (!updatedResult) {
                throw new ApiError_1.ApiError('Result not found', 404);
            }
            return updatedResult;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to update result value', 500);
        }
    }
    async verifyResult(id, userId, userName) {
        try {
            const result = await result_schema_1.Result.findByIdAndUpdate(id, {
                status: 'verified',
                verifiedBy: new mongoose_1.Types.ObjectId(userId),
                verifiedByUser: userName,
                verificationDate: new Date()
            }, { new: true }).populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('patient', 'firstName lastName mrn')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email');
            if (!result) {
                throw new ApiError_1.ApiError('Result not found', 404);
            }
            return result;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to verify result', 500);
        }
    }
    async bulkVerifyResults(ids, userId, userName) {
        try {
            const updateData = {
                status: 'verified',
                verifiedBy: new mongoose_1.Types.ObjectId(userId),
                verifiedByUser: userName,
                verificationDate: new Date()
            };
            const result = await result_schema_1.Result.updateMany({
                _id: { $in: ids },
                isActive: true
            }, updateData);
            return result;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to bulk verify results', 500);
        }
    }
    async rejectResult(id, userId, reason) {
        try {
            const result = await result_schema_1.Result.findByIdAndUpdate(id, {
                status: 'rejected',
                rejectedBy: new mongoose_1.Types.ObjectId(userId),
                rejectedReason: reason
            }, { new: true }).populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('patient', 'firstName lastName mrn')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email');
            if (!result) {
                throw new ApiError_1.ApiError('Result not found', 404);
            }
            return result;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to reject result', 500);
        }
    }
    async bulkRejectResults(ids, userId, reason) {
        try {
            const updateData = {
                status: 'rejected',
                rejectedBy: new mongoose_1.Types.ObjectId(userId),
                rejectedReason: reason
            };
            const result = await result_schema_1.Result.updateMany({
                _id: { $in: ids },
                isActive: true
            }, updateData);
            return result;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to bulk reject results', 500);
        }
    }
    async markResultAsCritical(id) {
        try {
            const result = await result_schema_1.Result.findByIdAndUpdate(id, {
                criticalValue: true,
                criticalValueNotifiedAt: new Date()
            }, { new: true }).populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('patient', 'firstName lastName mrn')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email');
            if (!result) {
                throw new ApiError_1.ApiError('Result not found', 404);
            }
            return result;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to mark result as critical', 500);
        }
    }
    async getResultsByOrder(id) {
        try {
            const results = await result_schema_1.Result.find({
                order: id,
                isActive: true
            })
                .populate('test', 'name code category unit')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email')
                .sort({ createdAt: 1 });
            return results;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get results by order', 500);
        }
    }
    async getResultsByPatient(id, limit = 100) {
        try {
            const results = await result_schema_1.Result.find({
                patient: id,
                isActive: true
            })
                .populate({
                path: 'order',
                select: 'orderNumber createdAt'
            })
                .populate('test', 'name code category unit')
                .sort({ createdAt: -1 })
                .limit(limit);
            return results;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get results by patient', 500);
        }
    }
    async getCriticalResults() {
        try {
            const results = await result_schema_1.Result.find({
                criticalValue: true,
                isActive: true
            })
                .populate('patient', 'firstName lastName mrn phone')
                .populate('order', 'orderNumber')
                .populate('test', 'name code category')
                .populate('enteredBy', 'firstName lastName email')
                .sort({ criticalValueNotifiedAt: -1 });
            return results;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get critical results', 500);
        }
    }
    async getAbnormalResults(limit = 50) {
        try {
            const results = await result_schema_1.Result.find({
                isAbnormal: true,
                isActive: true
            })
                .populate('patient', 'firstName lastName mrn')
                .populate('order', 'orderNumber')
                .populate('test', 'name code category')
                .sort({ createdAt: -1 })
                .limit(limit);
            return results;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get abnormal results', 500);
        }
    }
    async getResultsForReview(limit = 20) {
        try {
            const results = await result_schema_1.Result.find({
                status: { $in: ['completed', 'requires_review'] },
                isActive: true
            })
                .populate('patient', 'firstName lastName mrn phone')
                .populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('enteredBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .limit(limit);
            return results;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get results for review', 500);
        }
    }
    async addCommentToResult(id, comment) {
        try {
            const result = await result_schema_1.Result.findByIdAndUpdate(id, {
                comments: comment,
                updatedAt: new Date()
            }, { new: true }).populate('order', 'orderNumber')
                .populate('test', 'name code category unit')
                .populate('patient', 'firstName lastName mrn')
                .populate('enteredBy', 'firstName lastName email')
                .populate('verifiedBy', 'firstName lastName email');
            if (!result) {
                throw new ApiError_1.ApiError('Result not found', 404);
            }
            return result;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to add comment to result', 500);
        }
    }
    async getResultStatistics(dateRange) {
        try {
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
                        ]
                    }
                }
            ]);
            return statistics[0];
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get result statistics', 500);
        }
    }
    async searchResults(query, limit = 20) {
        try {
            const searchQuery = {
                isActive: true,
                $or: [
                    { testName: { $regex: query, $options: 'i' } },
                    { testCode: { $regex: query, $options: 'i' } },
                    { patientName: { $regex: query, $options: 'i' } },
                    { patientMRN: { $regex: query, $options: 'i' } },
                    { comments: { $regex: query, $options: 'i' } }
                ]
            };
            const results = await result_schema_1.Result.find(searchQuery)
                .populate('patient', 'firstName lastName mrn')
                .populate('order', 'orderNumber')
                .populate('test', 'name code category')
                .sort({ createdAt: -1 })
                .limit(limit);
            return results;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to search results', 500);
        }
    }
    async getPendingTestsForOrder(orderId) {
        try {
            const order = await order_schema_1.Order.findById(orderId)
                .populate('tests.test')
                .populate('patient');
            if (!order) {
                throw new ApiError_1.ApiError('Order not found', 404);
            }
            const existingResults = await result_schema_1.Result.find({
                order: orderId,
                isActive: true
            }).select('test');
            const existingTestIds = existingResults.map(result => result.test.toString());
            const pendingTests = order.tests.filter((orderTest) => {
                const testId = orderTest.test._id.toString();
                return !existingTestIds.includes(testId);
            });
            return {
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    priority: order.priority,
                    createdAt: order.createdAt,
                    patient: order.patient
                },
                pendingTests: pendingTests.map((orderTest) => ({
                    test: orderTest.test,
                    price: orderTest.price
                }))
            };
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to get pending tests for order', 500);
        }
    }
}
exports.ResultService = ResultService;
