"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const Order_model_1 = require("../models/Order.model");
const Patient_model_1 = require("../models/Patient.model");
const Test_model_1 = require("../models/Test.model");
const generateID_1 = require("../utils/generateID");
const mongoose_1 = require("mongoose");
const ApiError_1 = require("../utils/ApiError");
class OrderService {
    async createOrder(data) {
        try {
            const orderNumber = await generateID_1.IDGenerator.generateOrderNumber();
            const patient = await Patient_model_1.Patient.findById(data.patientId);
            if (!patient) {
                throw new Error('Patient not found');
            }
            const testIds = data.tests.map((test) => test.testId);
            const tests = await Test_model_1.Test.find({ '_id': { $in: testIds } });
            if (tests.length !== testIds.length) {
                throw new Error('One or more tests not found');
            }
            const totalAmount = tests.reduce((sum, test) => sum + (test.price || 0), 0);
            const orderItems = tests.map(test => ({
                testId: test._id,
                testName: test.testName,
                testCode: test.testCode,
                price: test.price,
                quantity: 1
            }));
            const orderData = {
                ...data,
                orderNumber,
                patient: patient._id,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientMRN: patient.patientId,
                tests: testIds,
                orderItems,
                totalAmount,
                finalAmount: totalAmount - (data.discountAmount || 0),
                status: 'pending',
                isActive: true,
                createdAt: new Date()
            };
            const order = await Order_model_1.Order.create(orderData);
            return order;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to create order: ' + error.message, 500);
        }
    }
    async getAllOrders(filters) {
        try {
            const { page = 1, limit = 10, search, status, priority, patientId, doctorId, department, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
            const queryFilters = {};
            if (status)
                queryFilters.status = status;
            if (priority)
                queryFilters.priority = priority;
            if (patientId)
                queryFilters.patient = patientId;
            if (doctorId)
                queryFilters.doctorId = doctorId;
            if (startDate || endDate) {
                queryFilters.createdAt = {};
                if (startDate)
                    queryFilters.createdAt.$gte = new Date(startDate);
                if (endDate)
                    queryFilters.createdAt.$lte = new Date(endDate);
            }
            const paginationFilters = {
                ...queryFilters,
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                department,
                sortBy,
                sortOrder
            };
            console.log('🔍 [ORDER SERVICE] Using direct Mongoose queries...');
            const orders = await Order_model_1.Order.find(queryFilters)
                .populate('patient', 'firstName lastName patientId phone')
                .populate('tests', 'testName testCode category price')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));
            console.log('🔍 [ORDER SERVICE] Orders found:', orders.length);
            const total = await Order_model_1.Order.countDocuments(queryFilters);
            console.log('🔍 [ORDER SERVICE] Total count:', total);
            return {
                orders,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            };
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch orders: ${error.message}`);
        }
    }
    async getOrderById(id) {
        try {
            const order = await OrderModel.findById(id)
                .populate('patient', 'firstName lastName patientId dateOfBirth gender phone')
                .populate('tests', 'testName testCode category price')
                .populate('orderedBy', 'firstName lastName username')
                .populate('doctorId', 'firstName lastName specialization')
                .populate('collectedBy', 'firstName lastName username');
            if (!order) {
                throw new ApiError_1.ApiError('Order not found', 404);
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError('Failed to fetch order: ' + error.message, 500);
        }
    }
    async getOrderByNumber(orderNumber) {
        try {
            const order = await OrderModel.findByOrderNumber(orderNumber);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to fetch order: ${error.message}`);
        }
    }
    async updateOrder(id, data, session) {
        try {
            const order = session
                ? await OrderModel.updateById(id, { ...data, updatedAt: new Date() })
                : await OrderModel.updateById(id, { ...data, updatedAt: new Date() });
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to update order: ${error.message}`);
        }
    }
    async updateOrderStatus(id, status, userId, notes) {
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const updateData = { status, updatedAt: new Date() };
            if (notes)
                updateData.statusNotes = notes;
            if (status === 'sample_collected' && userId) {
                updateData.sampleCollectedAt = new Date();
                updateData.collectedBy = userId;
            }
            if (status === 'in_progress') {
                updateData.startedAt = new Date();
            }
            if (status === 'completed') {
                updateData.completedAt = new Date();
            }
            if (status === 'cancelled') {
                updateData.cancelledAt = new Date();
                if (userId)
                    updateData.cancelledBy = userId;
            }
            const order = await OrderModel.updateById(id, updateData);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            await session.commitTransaction();
            session.endSession();
            return order;
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to update order status: ${error.message}`);
        }
    }
    async markSampleCollected(id, userId, notes) {
        try {
            const updateData = {
                status: 'sample_collected',
                sampleCollectedAt: new Date(),
                collectedBy: userId,
                updatedAt: new Date()
            };
            if (notes)
                updateData.collectionNotes = notes;
            const order = await OrderModel.updateById(id, updateData);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to mark sample as collected: ${error.message}`);
        }
    }
    async completeOrder(id, userId) {
        try {
            const updateData = {
                status: 'completed',
                completedAt: new Date(),
                updatedAt: new Date()
            };
            if (userId)
                updateData.completedBy = userId;
            const order = await OrderModel.updateById(id, updateData);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to complete order: ${error.message}`);
        }
    }
    async cancelOrder(id, reason, userId) {
        try {
            const updateData = {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancellationReason: reason,
                updatedAt: new Date()
            };
            if (userId)
                updateData.cancelledBy = userId;
            const order = await OrderModel.updateById(id, updateData);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to cancel order: ${error.message}`);
        }
    }
    async getOrdersByPatient(patientId, limit = 50) {
        try {
            return await OrderModel.findByPatient(patientId, limit);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch patient orders: ${error.message}`);
        }
    }
    async getOrdersByDoctor(doctorId, limit = 50) {
        try {
            return await OrderModel.findByDoctor(doctorId, limit);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch doctor orders: ${error.message}`);
        }
    }
    async getRecentOrders(days = 7, limit = 10) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const orders = await OrderModel.find({
                createdAt: { $gte: startDate },
                isActive: true
            })
                .populate('patient', 'firstName lastName patientId')
                .sort({ createdAt: -1 })
                .limit(limit);
            return orders;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to fetch recent orders: ' + error.message, 500);
        }
    }
    async getOrderStatistics(dateRange) {
        try {
            return await OrderModel.getOrderStatistics(dateRange);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch order statistics: ${error.message}`);
        }
    }
    async addTestToOrder(orderId, test, session) {
        try {
            const order = session
                ? await OrderModel.addTest(orderId, test)
                : await OrderModel.addTest(orderId, test);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to add test to order: ${error.message}`);
        }
    }
    async removeTestFromOrder(orderId, testId, session) {
        try {
            const order = session
                ? await OrderModel.removeTest(orderId, testId)
                : await OrderModel.removeTest(orderId, testId);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to remove test from order: ${error.message}`);
        }
    }
    async updateOrderPayment(orderId, status, discount) {
        try {
            const updateData = {
                paymentStatus: status,
                updatedAt: new Date()
            };
            if (discount !== undefined) {
                updateData.discount = discount;
            }
            const order = await OrderModel.updateById(orderId, updateData);
            if (!order) {
                throw new ApiError_1.ApiError(404, 'Order not found');
            }
            return order;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to update payment: ${error.message}`);
        }
    }
    async getOverdueOrders(limit = 20) {
        try {
            return await OrderModel.findOverdueOrders(limit);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch overdue orders: ${error.message}`);
        }
    }
    async bulkCreateOrders(ordersData) {
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const orders = [];
            for (const orderData of ordersData) {
                const order = await this.createOrder(orderData, session);
                orders.push(order);
            }
            await session.commitTransaction();
            session.endSession();
            return orders;
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError_1.ApiError(500, `Bulk order creation failed: ${error.message}`);
        }
    }
    async bulkUpdateStatus(updates) {
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const results = [];
            for (const { orderId, status, userId } of updates) {
                const order = await this.updateOrderStatus(orderId, status, userId);
                results.push(order);
            }
            await session.commitTransaction();
            session.endSession();
            return results;
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError_1.ApiError(500, `Bulk status update failed: ${error.message}`);
        }
    }
}
exports.OrderService = OrderService;
