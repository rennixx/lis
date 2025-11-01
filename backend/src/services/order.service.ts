// @ts-nocheck
import { Order, IOrder } from '../models/Order.model';
import { Patient } from '../models/Patient.model';
import { Test } from '../models/Test.model';
import { IDGenerator } from '../utils/generateID';
import { startSession } from 'mongoose';
import { ApiError } from '../utils/ApiError';

export class OrderService {
  // Create Order with transaction and auto-generated order number
  async createOrder(data: Partial<IOrder>) {
    const session = await startSession();
    session.startTransaction();

    try {
      const orderNumber = await IDGenerator.generateOrderNumber();

      // Get patient information for denormalization
      const patient = await Patient.findById(data.patient).session(session);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get test information for denormalization
      const tests = await Test.find({ '_id': { $in: data.tests } }).session(session);
      if (tests.length !== data.tests.length) {
        throw new Error('One or more tests not found');
      }

      // Calculate total amount
      const totalAmount = tests.reduce((sum, test) => sum + (test.price || 0), 0);

      // Create order items with denormalized test data
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
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientMRN: patient.patientId,
        orderItems,
        totalAmount,
        finalAmount: totalAmount - (data.discountAmount || 0),
        status: 'pending',
        isActive: true,
        createdAt: new Date()
      };

      const order = await Order.create([orderData], { session });
      await session.commitTransaction();

      return order[0];
    } catch (error) {
      await session.abortTransaction();
      throw new ApiError('Failed to create order: ' + error.message, 500);
    } finally {
      session.endSession();
    }
  }

  // Get all orders with filtering and pagination
  async getAllOrders(filters: any) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        priority,
        patientId,
        doctorId,
        department,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const queryFilters: any = {};

      if (status) queryFilters.status = status;
      if (priority) queryFilters.priority = priority;
      if (patientId) queryFilters.patient = patientId;
      if (doctorId) queryFilters.doctorId = doctorId;

      if (startDate || endDate) {
        queryFilters.createdAt = {};
        if (startDate) queryFilters.createdAt.$gte = new Date(startDate);
        if (endDate) queryFilters.createdAt.$lte = new Date(endDate);
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

      const [orders, total] = await Promise.all([
        OrderModel.findAll(paginationFilters),
        OrderModel.countDocuments(queryFilters)
      ]);

      return {
        orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      };
    } catch (error) {
      throw new ApiError(500, `Failed to fetch orders: ${error.message}`);
    }
  }

  // Get order by ID with populated patient and tests
  async getOrderById(id: string) {
    try {
      const order = await OrderModel.findById(id)
        .populate('patient', 'firstName lastName patientId dateOfBirth gender phone')
        .populate('tests', 'testName testCode category price')
        .populate('orderedBy', 'firstName lastName username')
        .populate('doctorId', 'firstName lastName specialization')
        .populate('collectedBy', 'firstName lastName username');

      if (!order) {
        throw new ApiError('Order not found', 404);
      }
      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch order: ' + error.message, 500);
    }
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string) {
    try {
      const order = await OrderModel.findByOrderNumber(orderNumber);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }
      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to fetch order: ${error.message}`);
    }
  }

  // Update order with transaction support
  async updateOrder(id: string, data: Partial<IOrder>, session?: any) {
    try {
      const order = session
        ? await OrderModel.updateById(id, { ...data, updatedAt: new Date() })
        : await OrderModel.updateById(id, { ...data, updatedAt: new Date() });

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update order: ${error.message}`);
    }
  }

  // Update order status with transaction support
  async updateOrderStatus(id: string, status: string, userId?: string, notes?: string) {
    const session = await startSession();
    session.startTransaction();

    try {
      const updateData: any = { status, updatedAt: new Date() };

      if (notes) updateData.statusNotes = notes;

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
        if (userId) updateData.cancelledBy = userId;
      }

      const order = await OrderModel.updateById(id, updateData);

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      await session.commitTransaction();
      session.endSession();

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update order status: ${error.message}`);
    }
  }

  // Mark sample as collected
  async markSampleCollected(id: string, userId: string, notes?: string) {
    try {
      const updateData = {
        status: 'sample_collected',
        sampleCollectedAt: new Date(),
        collectedBy: userId,
        updatedAt: new Date()
      };

      if (notes) updateData.collectionNotes = notes;

      const order = await OrderModel.updateById(id, updateData);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to mark sample as collected: ${error.message}`);
    }
  }

  // Complete order
  async completeOrder(id: string, userId?: string) {
    try {
      const updateData = {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      };

      if (userId) updateData.completedBy = userId;

      const order = await OrderModel.updateById(id, updateData);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to complete order: ${error.message}`);
    }
  }

  // Cancel order
  async cancelOrder(id: string, reason: string, userId?: string) {
    try {
      const updateData = {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      };

      if (userId) updateData.cancelledBy = userId;

      const order = await OrderModel.updateById(id, updateData);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to cancel order: ${error.message}`);
    }
  }

  // Get orders by patient
  async getOrdersByPatient(patientId: string, limit: number = 50) {
    try {
      return await OrderModel.findByPatient(patientId, limit);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch patient orders: ${error.message}`);
    }
  }

  // Get orders by doctor
  async getOrdersByDoctor(doctorId: string, limit: number = 50) {
    try {
      return await OrderModel.findByDoctor(doctorId, limit);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch doctor orders: ${error.message}`);
    }
  }

  // Get recent orders
  async getRecentOrders(days: number = 7, limit: number = 10) {
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
    } catch (error) {
      throw new ApiError('Failed to fetch recent orders: ' + error.message, 500);
    }
  }

  // Get order statistics with aggregation
  async getOrderStatistics(dateRange?: { start: Date; end: Date }) {
    try {
      return await OrderModel.getOrderStatistics(dateRange);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch order statistics: ${error.message}`);
    }
  }

  // Add test to order
  async addTestToOrder(orderId: string, test: any, session?: any) {
    try {
      const order = session
        ? await OrderModel.addTest(orderId, test)
        : await OrderModel.addTest(orderId, test);

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to add test to order: ${error.message}`);
    }
  }

  // Remove test from order
  async removeTestFromOrder(orderId: string, testId: string, session?: any) {
    try {
      const order = session
        ? await OrderModel.removeTest(orderId, testId)
        : await OrderModel.removeTest(orderId, testId);

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to remove test from order: ${error.message}`);
    }
  }

  // Update payment information
  async updateOrderPayment(orderId: string, status: string, discount?: number) {
    try {
      const updateData: any = {
        paymentStatus: status,
        updatedAt: new Date()
      };

      if (discount !== undefined) {
        updateData.discount = discount;
      }

      const order = await OrderModel.updateById(orderId, updateData);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update payment: ${error.message}`);
    }
  }

  // Get overdue orders
  async getOverdueOrders(limit: number = 20) {
    try {
      return await OrderModel.findOverdueOrders(limit);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch overdue orders: ${error.message}`);
    }
  }

  // Bulk create orders with transaction support
  async bulkCreateOrders(ordersData: Partial<IOrder>[]) {
    const session = await startSession();
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
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(500, `Bulk order creation failed: ${error.message}`);
    }
  }

  // Bulk update status with transaction support
  async bulkUpdateStatus(updates: Array<{ orderId: string; status: string; userId?: string }>) {
    const session = await startSession();
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
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(500, `Bulk status update failed: ${error.message}`);
    }
  }
}