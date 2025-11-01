"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.OrderModel = void 0;
const order_schema_1 = require("../schemas/order.schema");
Object.defineProperty(exports, "Order", { enumerable: true, get: function () { return order_schema_1.Order; } });
class OrderModel {
    static async create(orderData) {
        return await order_schema_1.Order.create(orderData);
    }
    static async findById(id) {
        return await order_schema_1.Order.findById(id)
            .populate('patient', 'firstName lastName mrn phone email')
            .populate('orderedBy', 'firstName lastName email')
            .populate('doctorId', 'firstName lastName email')
            .populate('collectedBy', 'firstName lastName')
            .populate('tests', 'name code category price')
            .populate('orderItems.testId', 'name code price');
    }
    static async findByOrderNumber(orderNumber) {
        return await order_schema_1.Order.findOne({ orderNumber, isActive: true })
            .populate('patient', 'firstName lastName mrn phone email')
            .populate('orderedBy', 'firstName lastName email')
            .populate('doctorId', 'firstName lastName email')
            .populate('tests', 'name code category price');
    }
    static async findAll(filters = {}, options = {}) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, priority, patientId, doctorId, department, startDate, endDate, ...queryFilters } = filters;
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        let query = { isActive: true, ...queryFilters };
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { patientName: { $regex: search, $options: 'i' } },
                { patientMRN: { $regex: search, $options: 'i' } },
                { doctorName: { $regex: search, $options: 'i' } }
            ];
        }
        if (status)
            query.status = status;
        if (priority)
            query.priority = priority;
        if (patientId)
            query.patient = patientId;
        if (doctorId)
            query.doctorId = doctorId;
        if (department)
            query.department = department;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        return await order_schema_1.Order.find(query)
            .populate('patient', 'firstName lastName mrn phone email')
            .populate('orderedBy', 'firstName lastName email')
            .populate('doctorId', 'firstName lastName email')
            .populate('tests', 'name code category price')
            .populate('orderItems.testId', 'name code price')
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }
    static async updateById(id, updateData) {
        return await order_schema_1.Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('patient', 'firstName lastName mrn phone email')
            .populate('orderedBy', 'firstName lastName email')
            .populate('doctorId', 'firstName lastName email');
    }
    static async deleteById(id) {
        return await order_schema_1.Order.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
    static async countDocuments(filters = {}) {
        let query = { isActive: true, ...filters };
        if (filters.search) {
            query.$or = [
                { orderNumber: { $regex: filters.search, $options: 'i' } },
                { patientName: { $regex: filters.search, $options: 'i' } },
                { patientMRN: { $regex: filters.search, $options: 'i' } }
            ];
            delete query.search;
        }
        return await order_schema_1.Order.countDocuments(query);
    }
    static async createOrder(orderData) {
        if (orderData.orderItems) {
            const totalAmount = orderData.orderItems.reduce((total, item) => {
                return total + (item.price * (item.quantity || 1));
            }, 0);
            orderData.totalAmount = totalAmount;
            orderData.finalAmount = totalAmount - (orderData.discountAmount || 0);
        }
        return await order_schema_1.Order.create(orderData);
    }
    static async updateOrderStatus(orderId, status, userId) {
        const updateData = { status };
        if (status === 'sample_collected') {
            updateData.sampleCollectedAt = new Date();
            if (userId)
                updateData.collectedBy = userId;
        }
        if (status === 'completed') {
            updateData.completedAt = new Date();
        }
        return await order_schema_1.Order.findByIdAndUpdate(orderId, updateData, { new: true }).populate('patient', 'firstName lastName mrn')
            .populate('orderedBy', 'firstName lastName email');
    }
    static async markSampleCollected(orderId, collectedBy) {
        return await order_schema_1.Order.findByIdAndUpdate(orderId, {
            status: 'sample_collected',
            sampleCollectedAt: new Date(),
            collectedBy
        }, { new: true });
    }
    static async markOrderCompleted(orderId) {
        return await order_schema_1.Order.findByIdAndUpdate(orderId, {
            status: 'completed',
            completedAt: new Date()
        }, { new: true });
    }
    static async cancelOrder(orderId, reason) {
        const updateData = { status: 'cancelled' };
        if (reason) {
            updateData.notes = reason;
        }
        return await order_schema_1.Order.findByIdAndUpdate(orderId, updateData, { new: true });
    }
    static async getOrdersByPatient(patientId, limit = 50) {
        return await order_schema_1.Order.find({
            patient: patientId,
            isActive: true
        })
            .populate('tests', 'name code category')
            .populate('orderedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getOrdersByDoctor(doctorId, limit = 50) {
        return await order_schema_1.Order.find({
            doctorId: doctorId,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('tests', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getOrdersByStatus(status, limit = 50) {
        return await order_schema_1.Order.find({
            status: status,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctorId', 'firstName lastName email')
            .populate('tests', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getOrdersByPriority(priority, limit = 50) {
        return await order_schema_1.Order.find({
            priority: priority,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctorId', 'firstName lastName email')
            .populate('tests', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getOverdueOrders() {
        return await order_schema_1.Order.find({
            status: { $in: ['pending', 'processing', 'sample_collected'] },
            expectedDeliveryTime: { $lt: new Date() },
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctorId', 'firstName lastName email')
            .sort({ expectedDeliveryTime: 1 });
    }
    static async getOrdersByDepartment(department, limit = 50) {
        return await order_schema_1.Order.find({
            department: department,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctorId', 'firstName lastName email')
            .populate('tests', 'name code category')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async updateOrderPayment(orderId, paymentStatus, discountAmount) {
        const updateData = { paymentStatus };
        if (discountAmount !== undefined) {
            updateData.discountAmount = discountAmount;
            const order = await order_schema_1.Order.findById(orderId);
            if (order) {
                updateData.finalAmount = order.totalAmount - discountAmount;
            }
        }
        return await order_schema_1.Order.findByIdAndUpdate(orderId, updateData, { new: true });
    }
    static async getOrderStatistics(dateRange) {
        const matchQuery = { isActive: true };
        if (dateRange) {
            matchQuery.createdAt = {
                $gte: dateRange.start,
                $lte: dateRange.end
            };
        }
        const statistics = await order_schema_1.Order.aggregate([
            { $match: matchQuery },
            {
                $facet: {
                    totalOrders: [{ $count: "count" }],
                    statusDistribution: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    priorityDistribution: [
                        {
                            $group: {
                                _id: "$priority",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    paymentDistribution: [
                        {
                            $group: {
                                _id: "$paymentStatus",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    revenue: [
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$finalAmount" },
                                totalDiscount: { $sum: "$discountAmount" },
                                averageOrderValue: { $avg: "$finalAmount" }
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
                                revenue: { $sum: "$finalAmount" }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);
        return statistics[0];
    }
    static async searchOrders(searchTerm, limit = 20) {
        const query = {
            isActive: true,
            $or: [
                { orderNumber: { $regex: searchTerm, $options: 'i' } },
                { patientName: { $regex: searchTerm, $options: 'i' } },
                { patientMRN: { $regex: searchTerm, $options: 'i' } },
                { doctorName: { $regex: searchTerm, $options: 'i' } }
            ]
        };
        return await order_schema_1.Order.find(query)
            .populate('patient', 'firstName lastName mrn phone email')
            .populate('doctorId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getRecentOrders(days = 7, limit = 20) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return await order_schema_1.Order.find({
            isActive: true,
            createdAt: { $gte: cutoffDate }
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctorId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async addTestToOrder(orderId, testId, testInfo) {
        return await order_schema_1.Order.findByIdAndUpdate(orderId, {
            $push: {
                tests: testId,
                orderItems: testInfo
            },
            updatedAt: new Date()
        }, { new: true });
    }
    static async removeTestFromOrder(orderId, testId) {
        return await order_schema_1.Order.findByIdAndUpdate(orderId, {
            $pull: {
                tests: testId,
                orderItems: { testId: testId }
            },
            updatedAt: new Date()
        }, { new: true });
    }
    static async getOrderWithResults(orderId) {
        return await order_schema_1.Order.findById(orderId)
            .populate('patient', 'firstName lastName mrn phone email')
            .populate('orderedBy', 'firstName lastName email')
            .populate('doctorId', 'firstName lastName email')
            .populate({
            path: 'tests',
            populate: {
                path: 'results',
                match: { isActive: true }
            }
        });
    }
}
exports.OrderModel = OrderModel;
