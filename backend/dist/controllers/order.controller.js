"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_validator_1 = require("../validators/order.validator");
const order_service_1 = require("../services/order.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const orderService = new order_service_1.OrderService();
class OrderController {
    constructor() {
        this.createOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const validatedData = order_validator_1.OrderZodSchema.create.parse(req.body);
            const order = await orderService.createOrder(validatedData);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Order created successfully', {
                data: order
            }));
        });
        this.getAllOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, search, status, priority, patientId, doctorId, department, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                status: status,
                priority: priority,
                patientId: patientId,
                doctorId: doctorId,
                department: department,
                startDate: startDate,
                endDate: endDate,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await orderService.getAllOrders(filters);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Orders retrieved successfully', {
                data: {
                    orders: result.orders,
                    pagination: {
                        page: filters.page,
                        limit: filters.limit,
                        total: result.total,
                        pages: Math.ceil(result.total / filters.limit)
                    }
                }
            }));
        });
        this.getOrderById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const order = await orderService.getOrderById(orderId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order retrieved successfully', {
                data: order
            }));
        });
        this.getOrderByNumber = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderNumber } = req.params;
            const order = await orderService.getOrderByNumber(orderNumber);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order retrieved successfully', {
                data: order
            }));
        });
        this.updateOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const validatedData = order_validator_1.OrderZodSchema.update.parse(req.body);
            const updatedOrder = await orderService.updateOrder(orderId, validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order updated successfully', {
                data: updatedOrder
            }));
        });
        this.updateOrderStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const { status } = order_validator_1.OrderZodSchema.updateStatus.parse(req.body);
            const userId = req.user.id;
            const order = await orderService.updateOrderStatus(orderId, status, userId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order status updated successfully', {
                data: order
            }));
        });
        this.markSampleCollected = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const userId = req.user.id;
            const order = await orderService.markSampleCollected(orderId, userId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Sample marked as collected', {
                data: order
            }));
        });
        this.completeOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const order = await orderService.completeOrder(orderId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order completed successfully', {
                data: order
            }));
        });
        this.cancelOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const { reason } = order_validator_1.OrderZodSchema.cancel.parse(req.body);
            const order = await orderService.cancelOrder(orderId, reason);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order cancelled successfully', {
                data: order
            }));
        });
        this.getOrdersByPatient = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { limit = 50 } = req.query;
            const orders = await orderService.getOrdersByPatient(patientId, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Orders by patient retrieved', {
                data: orders
            }));
        });
        this.getOrdersByDoctor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { doctorId } = req.params;
            const { limit = 50 } = req.query;
            const orders = await orderService.getOrdersByDoctor(doctorId, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Orders by doctor retrieved', {
                data: orders
            }));
        });
        this.getOrderStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startDate, endDate } = req.query;
            let dateRange;
            if (startDate && endDate) {
                dateRange = {
                    start: new Date(startDate),
                    end: new Date(endDate)
                };
            }
            const statistics = await orderService.getOrderStatistics(dateRange);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order statistics retrieved', {
                data: statistics
            }));
        });
        this.addTestToOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const validatedData = order_validator_1.OrderZodSchema.addTest.parse(req.body);
            const order = await orderService.addTestToOrder(orderId, validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test added to order successfully', {
                data: order
            }));
        });
        this.removeTestFromOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const { testId } = req.body;
            const order = await orderService.removeTestFromOrder(orderId, testId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test removed from order successfully', {
                data: order
            }));
        });
        this.updateOrderPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const validatedData = order_validator_1.OrderZodSchema.updatePayment.parse(req.body);
            const order = await orderService.updateOrderPayment(orderId, validatedData.paymentStatus, validatedData.discountAmount);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order payment updated successfully', {
                data: order
            }));
        });
        this.getOverdueOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const orders = await orderService.getOverdueOrders();
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Overdue orders retrieved', {
                data: orders
            }));
        });
        this.getRecentOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { days = 7, limit = 10 } = req.query;
            const orders = await orderService.getRecentOrders(parseInt(days), parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Recent orders retrieved', {
                data: orders
            }));
        });
        this.deleteOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const order = await orderService.cancelOrder(orderId, 'Deleted by user');
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Order deleted successfully', {
                data: order
            }));
        });
        this.bulkCreateOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orders } = req.body;
            const createdOrders = await orderService.bulkCreateOrders(orders);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Bulk orders created successfully', {
                data: createdOrders
            }));
        });
        this.bulkUpdateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { updates } = req.body;
            const updatedOrders = await orderService.bulkUpdateStatus(updates);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Bulk status update completed', {
                data: updatedOrders
            }));
        });
    }
}
exports.OrderController = OrderController;
