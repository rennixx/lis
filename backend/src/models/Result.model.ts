import { Result, IResult } from '../schemas/result.schema';
// @ts-ignore
import { Order } from '../schemas/order.schema';
// @ts-ignore
import { Test } from '../schemas/test.schema';

export class ResultModel {
  // Basic CRUD operations
  static async create(resultData: Partial<IResult>): Promise<IResult> {
    return await Result.create(resultData);
  }

  static async findById(id: string): Promise<IResult | null> {
    return await Result.findById(id)
      .populate('order', 'orderNumber')
      .populate('test', 'name code category unit')
      .populate('patient', 'firstName lastName mrn')
      .populate('enteredBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email');
  }

  static async findAll(filters: any = {}, options: any = {}): Promise<IResult[]> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      patientId,
      testId,
      orderId,
      enteredBy,
      verifiedBy,
      criticalValue,
      isAbnormal,
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
        { testName: { $regex: search, $options: 'i' } },
        { testCode: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientMRN: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (testId) query.test = testId;
    if (orderId) query.order = orderId;
    if (enteredBy) query.enteredBy = enteredBy;
    if (verifiedBy) query.verifiedBy = verifiedBy;
    if (criticalValue !== undefined) query.criticalValue = criticalValue;
    if (isAbnormal !== undefined) query.isAbnormal = isAbnormal;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await Result.find(query)
      .populate('order', 'orderNumber')
      .populate('test', 'name code category unit')
      .populate('patient', 'firstName lastName mrn')
      .populate('enteredBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  static async updateById(id: string, updateData: Partial<IResult>): Promise<IResult | null> {
    return await Result.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('order', 'orderNumber')
     .populate('test', 'name code category unit')
     .populate('patient', 'firstName lastName mrn')
     .populate('enteredBy', 'firstName lastName email')
     .populate('verifiedBy', 'firstName lastName email');
  }

  static async deleteById(id: string): Promise<IResult | null> {
    return await Result.findByIdAndUpdate(
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
        { testName: { $regex: filters.search, $options: 'i' } },
        { patientName: { $regex: filters.search, $options: 'i' } }
      ];
      delete query.search;
    }

    return await Result.countDocuments(query);
  }

  // Specific methods for result operations
  static async createResult(resultData: Partial<IResult>): Promise<IResult> {
    // Check if result is abnormal based on normal range
    if (resultData.valueType === 'number' && resultData.normalRange) {
      const value = parseFloat(resultData.value);
      const { min, max } = resultData.normalRange;

      let isAbnormal = false;
      if (min !== undefined && value < min) isAbnormal = true;
      if (max !== undefined && value > max) isAbnormal = true;

      resultData.isAbnormal = isAbnormal;
    }

    return await Result.create(resultData);
  }

  static async updateResultValue(resultId: string, value: any, enteredBy: string): Promise<IResult | null> {
    const updateData: any = { value };

    // Re-check if abnormal
    const result = await Result.findById(resultId).populate('test');
    if (result && result.test) {
      const test = result.test as any;
      if (test.normalRange) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const { min, max } = test.normalRange;
          let isAbnormal = false;
          if (min !== undefined && numValue < min) isAbnormal = true;
          if (max !== undefined && numValue > max) isAbnormal = true;
          updateData.isAbnormal = isAbnormal;
        }
      }
    }

    updateData.status = 'completed';
    updateData.analysisDate = new Date();

    return await Result.findByIdAndUpdate(
      resultId,
      updateData,
      { new: true }
    );
  }

  static async verifyResult(resultId: string, verifiedBy: string, verifiedByUser: string): Promise<IResult | null> {
    return await Result.findByIdAndUpdate(
      resultId,
      {
        status: 'verified',
        verifiedBy,
        verifiedByUser,
        verificationDate: new Date()
      },
      { new: true }
    );
  }

  static async rejectResult(resultId: string, rejectedBy: string, reason: string): Promise<IResult | null> {
    return await Result.findByIdAndUpdate(
      resultId,
      {
        status: 'rejected',
        rejectedBy,
        rejectedReason: reason
      },
      { new: true }
    );
  }

  static async markResultAsCritical(resultId: string): Promise<IResult | null> {
    return await Result.findByIdAndUpdate(
      resultId,
      {
        criticalValue: true,
        criticalValueNotifiedAt: new Date()
      },
      { new: true }
    );
  }

  static async getResultsByOrder(orderId: string): Promise<IResult[]> {
    return await Result.find({
      order: orderId,
      isActive: true
    })
    .populate('test', 'name code category unit')
    .populate('enteredBy', 'firstName lastName email')
    .populate('verifiedBy', 'firstName lastName email')
    .sort({ createdAt: 1 });
  }

  static async getResultsByPatient(patientId: string, limit: number = 100): Promise<IResult[]> {
    return await Result.find({
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

  static async getResultsByTest(testId: string, limit: number = 50): Promise<IResult[]> {
    return await Result.find({
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

  static async getResultsByStatus(status: string, limit: number = 50): Promise<IResult[]> {
    return await Result.find({
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

  static async getCriticalResults(): Promise<IResult[]> {
    return await Result.find({
      criticalValue: true,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn phone')
    .populate('order', 'orderNumber')
    .populate('test', 'name code category')
    .populate('enteredBy', 'firstName lastName email')
    .sort({ criticalValueNotifiedAt: -1 });
  }

  static async getAbnormalResults(limit: number = 50): Promise<IResult[]> {
    return await Result.find({
      isAbnormal: true,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('order', 'orderNumber')
    .populate('test', 'name code category')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getOverdueResults(): Promise<IResult[]> {
    return await Result.find({
      status: { $in: ['pending', 'in_progress'] },
      isActive: true
    })
    .populate('order', 'orderNumber')
    .populate('test', 'name code turnaroundTime')
    .populate('patient', 'firstName lastName mrn')
    .sort({ createdAt: 1 });
  }

  static async getResultsByEnteredBy(enteredBy: string, limit: number = 50): Promise<IResult[]> {
    return await Result.find({
      enteredBy: enteredBy,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('order', 'orderNumber')
    .populate('test', 'name code category')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getResultsByVerifiedBy(verifiedBy: string, limit: number = 50): Promise<IResult[]> {
    return await Result.find({
      verifiedBy: verifiedBy,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('order', 'orderNumber')
    .populate('test', 'name code category')
    .sort({ verificationDate: -1 })
    .limit(limit);
  }

  static async getResultStatistics(dateRange?: { start: Date; end: Date }): Promise<any> {
    const matchQuery: any = { isActive: true };

    if (dateRange) {
      matchQuery.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const statistics = await Result.aggregate([
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

  static async searchResults(searchTerm: string, limit: number = 20): Promise<IResult[]> {
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

    return await Result.find(query)
      .populate('patient', 'firstName lastName mrn')
      .populate('order', 'orderNumber')
      .populate('test', 'name code category')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async getResultsForReview(limit: number = 20): Promise<IResult[]> {
    return await Result.find({
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

  static async bulkVerifyResults(resultIds: string[], verifiedBy: string, verifiedByUser: string): Promise<any> {
    const updateData = {
      status: 'verified',
      verifiedBy,
      verifiedByUser,
      verificationDate: new Date()
    };

    return await Result.updateMany(
      {
        _id: { $in: resultIds },
        isActive: true
      },
      updateData
    );
  }

  static async bulkRejectResults(resultIds: string[], rejectedBy: string, reason: string): Promise<any> {
    const updateData = {
      status: 'rejected',
      rejectedBy,
      rejectedReason: reason
    };

    return await Result.updateMany(
      {
        _id: { $in: resultIds },
        isActive: true
      },
      updateData
    );
  }

  static async addCommentToResult(resultId: string, comment: string): Promise<IResult | null> {
    return await Result.findByIdAndUpdate(
      resultId,
      {
        comments: comment,
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async addNotesToResult(resultId: string, notes: string): Promise<IResult | null> {
    return await Result.findByIdAndUpdate(
      resultId,
      {
        notes,
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async getResultWithAttachments(resultId: string): Promise<IResult | null> {
    return await Result.findById(resultId)
      .populate('attachments')
      .populate('order', 'orderNumber')
      .populate('test', 'name code category')
      .populate('patient', 'firstName lastName mrn');
  }
}