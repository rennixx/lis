import { Request, Response } from 'express';
import { OrderZodSchema } from '../validators/order.validator';
import { OrderService } from '../services/order.service';
import { ResultService } from '../services/result.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const orderService = new OrderService();
const resultService = new ResultService();

export class OrderController {
  // Create Order
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = OrderZodSchema.create.parse(req.body);

    // @ts-ignore
    const order = await orderService.createOrder(validatedData as any);

  return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Order created successfully', {
        data: order
      })
    );
  });

  // Get All Orders
  getAllOrders = asyncHandler(async (req: Request, res: Response) => {
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
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      status: status as string,
      priority: priority as string,
      patientId: patientId as string,
      doctorId: doctorId as string,
      department: department as string,
      startDate: startDate as string,
      endDate: endDate as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await orderService.getAllOrders(filters);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Orders retrieved successfully', {
        data: {
          orders: result.orders,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            pages: Math.ceil(result.total / filters.limit)
          }
        }
      })
    );
  });

  // Get Order by ID
  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const order = await orderService.getOrderById(orderId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order retrieved successfully', {
        data: order
      })
    );
  });

  // Get Order by Order Number
  getOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;

    const order = await orderService.getOrderByNumber(orderNumber);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order retrieved successfully', {
        data: order
      })
    );
  });

  // Update Order
  updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const validatedData = OrderZodSchema.update.parse(req.body);

    // @ts-ignore
    const updatedOrder = await orderService.updateOrder(orderId, validatedData as any);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order updated successfully', {
        data: updatedOrder
      })
    );
  });

  // Update Order Status
  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { status } = OrderZodSchema.updateStatus.parse(req.body);
    const userId = (req.user as any).id;

    const order = await orderService.updateOrderStatus(orderId, status, userId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order status updated successfully', {
        data: order
      })
    );
  });

  // Mark Sample Collected
  markSampleCollected = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = (req.user as any).id;

    const order = await orderService.markSampleCollected(orderId, userId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Sample marked as collected', {
        data: order
      })
    );
  });

  // Complete Order
  completeOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const order = await orderService.completeOrder(orderId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order completed successfully', {
        data: order
      })
    );
  });

  // Cancel Order
  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { reason } = OrderZodSchema.cancel.parse(req.body);

    const order = await orderService.cancelOrder(orderId, reason);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order cancelled successfully', {
        data: order
      })
    );
  });

  // Get Orders by Patient
  getOrdersByPatient = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;

    const orders = await orderService.getOrdersByPatient(
      patientId,
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Orders by patient retrieved', {
        data: orders
      })
    );
  });

  // Get Orders by Doctor
  getOrdersByDoctor = asyncHandler(async (req: Request, res: Response) => {
    const { doctorId } = req.params;
    const { limit = 50 } = req.query;

    const orders = await orderService.getOrdersByDoctor(
      doctorId,
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Orders by doctor retrieved', {
        data: orders
      })
    );
  });

  // Get Order Statistics
  getOrderStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const statistics = await orderService.getOrderStatistics(dateRange);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order statistics retrieved', {
        data: statistics
      })
    );
  });

  // Add Test to Order
  addTestToOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const validatedData = OrderZodSchema.addTest.parse(req.body);

    const order = await orderService.addTestToOrder(orderId, validatedData);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test added to order successfully', {
        data: order
      })
    );
  });

  // Remove Test from Order
  removeTestFromOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { testId } = req.body;

    const order = await orderService.removeTestFromOrder(orderId, testId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test removed from order successfully', {
        data: order
      })
    );
  });

  // Update Order Payment
  updateOrderPayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const validatedData = OrderZodSchema.updatePayment.parse(req.body);

    // @ts-ignore
    const order = await orderService.updateOrderPayment(
      orderId,
      (validatedData as any).paymentStatus,
      (validatedData as any).discountAmount
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order payment updated successfully', {
        data: order
      })
    );
  });

  // Get Overdue Orders
  getOverdueOrders = asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderService.getOverdueOrders();

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Overdue orders retrieved', {
        data: orders
      })
    );
  });

  // Get Recent Orders
  getRecentOrders = asyncHandler(async (req: Request, res: Response) => {
    const { days = 7, limit = 10 } = req.query;

    const orders = await orderService.getRecentOrders(parseInt(days as string), parseInt(limit as string));

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Recent orders retrieved', {
        data: orders
      })
    );
  });

  // Delete Order (Soft Delete)
  deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const order = await orderService.cancelOrder(orderId, 'Deleted by user');

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Order deleted successfully', {
        data: order
      })
    );
  });

  // Bulk Create Orders
  bulkCreateOrders = asyncHandler(async (req: Request, res: Response) => {
    const { orders } = req.body;

    const createdOrders = await orderService.bulkCreateOrders(orders);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Bulk orders created successfully', {
        data: createdOrders
      })
    );
  });

  // Bulk Update Status
  bulkUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { updates } = req.body;

    const updatedOrders = await orderService.bulkUpdateStatus(updates);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Bulk status update completed', {
        data: updatedOrders
      })
    );
  });

  // Get Pending Tests for Order
  getPendingTests = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const pendingTestsData = await resultService.getPendingTestsForOrder(orderId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Pending tests retrieved successfully', {
        data: pendingTestsData
      })
    );
  });
}