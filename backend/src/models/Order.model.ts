import { Order, IOrder } from '../schemas/order.schema';
// @ts-ignore
import Patient from '../schemas/patient.schema';
// @ts-ignore
import Test from '../schemas/test.schema';

export class OrderModel {
  // Basic CRUD operations
  static async create(orderData: Partial<IOrder>): Promise<IOrder> {
    return await Order.create(orderData);
  }

  static async findById(id: string): Promise<IOrder | null> {
    return await Order.findById(id)
      .populate('patient', 'firstName lastName mrn phone email')
      .populate('orderedBy', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')
      .populate('collectedBy', 'firstName lastName')
      .populate('tests', 'name code category price')
      .populate('orderItems.testId', 'name code price');
  }

  static async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    return await Order.findOne({ orderNumber, isActive: true })
      .populate('patient', 'firstName lastName mrn phone email')
      .populate('orderedBy', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')
      .populate('tests', 'name code category price');
  }

  static async findAll(filters: any = {}, options: any = {}): Promise<IOrder[]> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      priority,
      patientId,
      doctorId,
      department,
      startDate,
      endDate,
      ...queryFilters
    } = filters;

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let query: any = { isActive: true, ...queryFilters };

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientMRN: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (department) query.department = department;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await Order.find(query)
      .populate('patient', 'firstName lastName mrn phone email')
      .populate('orderedBy', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')
      .populate('tests', 'name code category price')
      .populate('orderItems.testId', 'name code price')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  static async updateById(id: string, updateData: Partial<IOrder>): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName mrn phone email')
     .populate('orderedBy', 'firstName lastName email')
     .populate('doctorId', 'firstName lastName email');
  }

  static async deleteById(id: string): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  static async countDocuments(filters: any = {}): Promise<number> {
    let query: any = { isActive: true, ...filters };

    if (filters.search) {
      query.$or = [
        { orderNumber: { $regex: filters.search, $options: 'i' } },
        { patientName: { $regex: filters.search, $options: 'i' } },
        { patientMRN: { $regex: filters.search, $options: 'i' } }
      ];
      delete query.search;
    }

    return await Order.countDocuments(query);
  }

  // Specific methods for order operations
  static async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    // Calculate total amount
    if (orderData.orderItems) {
      const totalAmount = orderData.orderItems.reduce((total: number, item: any) => {
        return total + (item.price * (item.quantity || 1));
      }, 0);

      orderData.totalAmount = totalAmount;
      orderData.finalAmount = totalAmount - (orderData.discountAmount || 0);
    }

    return await Order.create(orderData);
  }

  static async updateOrderStatus(orderId: string, status: string, userId?: string): Promise<IOrder | null> {
    const updateData: any = { status };

    if (status === 'sample_collected') {
      updateData.sampleCollectedAt = new Date();
      if (userId) updateData.collectedBy = userId;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    return await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('patient', 'firstName lastName mrn')
     .populate('orderedBy', 'firstName lastName email');
  }

  static async markSampleCollected(orderId: string, collectedBy: string): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'sample_collected',
        sampleCollectedAt: new Date(),
        collectedBy
      },
      { new: true }
    );
  }

  static async markOrderCompleted(orderId: string): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );
  }

  static async cancelOrder(orderId: string, reason?: string): Promise<IOrder | null> {
    const updateData: any = { status: 'cancelled' };
    if (reason) {
      updateData.notes = reason;
    }

    return await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
  }

  static async getOrdersByPatient(patientId: string, limit: number = 50): Promise<IOrder[]> {
    return await Order.find({
      patient: patientId,
      isActive: true
    })
    .populate('tests', 'name code category')
    .populate('orderedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getOrdersByDoctor(doctorId: string, limit: number = 50): Promise<IOrder[]> {
    return await Order.find({
      doctorId: doctorId,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('tests', 'name code category')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getOrdersByStatus(status: string, limit: number = 50): Promise<IOrder[]> {
    return await Order.find({
      status: status,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('doctorId', 'firstName lastName email')
    .populate('tests', 'name code category')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getOrdersByPriority(priority: string, limit: number = 50): Promise<IOrder[]> {
    return await Order.find({
      priority: priority,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('doctorId', 'firstName lastName email')
    .populate('tests', 'name code category')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getOverdueOrders(): Promise<IOrder[]> {
    return await Order.find({
      status: { $in: ['pending', 'processing', 'sample_collected'] },
      expectedDeliveryTime: { $lt: new Date() },
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('doctorId', 'firstName lastName email')
    .sort({ expectedDeliveryTime: 1 });
  }

  static async getOrdersByDepartment(department: string, limit: number = 50): Promise<IOrder[]> {
    return await Order.find({
      department: department,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('doctorId', 'firstName lastName email')
    .populate('tests', 'name code category')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async updateOrderPayment(orderId: string, paymentStatus: string, discountAmount?: number): Promise<IOrder | null> {
    const updateData: any = { paymentStatus };

    if (discountAmount !== undefined) {
      updateData.discountAmount = discountAmount;
      // Recalculate final amount
      const order = await Order.findById(orderId);
      if (order) {
        updateData.finalAmount = order.totalAmount - discountAmount;
      }
    }

    return await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
  }

  static async getOrderStatistics(dateRange?: { start: Date; end: Date }): Promise<any> {
    const matchQuery: any = { isActive: true };

    if (dateRange) {
      matchQuery.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const statistics = await Order.aggregate([
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

  static async searchOrders(searchTerm: string, limit: number = 20): Promise<IOrder[]> {
    const query = {
      isActive: true,
      $or: [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { patientName: { $regex: searchTerm, $options: 'i' } },
        { patientMRN: { $regex: searchTerm, $options: 'i' } },
        { doctorName: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await Order.find(query)
      .populate('patient', 'firstName lastName mrn phone email')
      .populate('doctorId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async getRecentOrders(days: number = 7, limit: number = 20): Promise<IOrder[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await Order.find({
      isActive: true,
      createdAt: { $gte: cutoffDate }
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('doctorId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async addTestToOrder(orderId: string, testId: string, testInfo: any): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(
      orderId,
      {
        $push: {
          tests: testId,
          orderItems: testInfo
        },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async removeTestFromOrder(orderId: string, testId: string): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(
      orderId,
      {
        $pull: {
          tests: testId,
          orderItems: { testId: testId }
        },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async getOrderWithResults(orderId: string): Promise<IOrder | null> {
    return await Order.findById(orderId)
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

// Export the raw Order schema and IOrder type for direct use
export { Order, IOrder };