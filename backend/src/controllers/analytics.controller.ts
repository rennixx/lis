import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import Patient from '../schemas/patient.schema';
import { Order } from '../schemas/order.schema';
import { Result } from '../schemas/result.schema';
import Test from '../schemas/test.schema';
import { SampleModel } from '../models/Sample.model';
import moment from 'moment';

export class AnalyticsController {

  // Dashboard overview metrics
  getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
    try {
      const today = moment().startOf('day');
      const tomorrow = moment(today).add(1, 'day');

      // Today's statistics
      const [
        todayPatients,
        todayOrders,
        todayResults,
        todayRevenue,
        pendingTests,
        urgentTests,
        criticalResults
      ] = await Promise.all([
        Patient.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
        Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
        Result.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
        Order.aggregate([
          { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
          { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]),
        Result.countDocuments({ status: 'pending' }),
        Order.countDocuments({
          priority: { $in: ['urgent', 'stat', 'critical'] },
          status: { $nin: ['completed', 'cancelled'] }
        }),
        Result.countDocuments({ criticalValue: true, status: { $ne: 'verified' } })
      ]);

      const revenue = todayRevenue[0]?.total || 0;

      // Recent orders (last 7 days)
      const recentOrders = await Order.find({
        createdAt: { $gte: moment().subtract(7, 'days') }
      })
        .populate('patient', 'firstName lastName')
        .populate('tests', 'testName testCode')
        .sort({ createdAt: -1 })
        .limit(10);

      // Test completion timeline (last 30 days)
      const testTimeline = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: moment().subtract(30, 'days') }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Popular tests (last 30 days)
      const popularTests = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: moment().subtract(30, 'days') }
          }
        },
        { $unwind: '$tests' },
        {
          $group: {
            _id: '$tests.testName',
            count: { $sum: 1 },
            revenue: { $sum: '$tests.price' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Monthly revenue trend (last 12 months)
      const monthlyRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: moment().subtract(12, 'months').startOf('month') }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$createdAt' }
            },
            revenue: { $sum: '$finalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Technician productivity (last 30 days)
      const technicianProductivity = await Result.aggregate([
        {
          $match: {
            createdAt: { $gte: moment().subtract(30, 'days') },
            enteredBy: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$enteredBy',
            completed: { $sum: 1 },
            verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
            completed: 1,
            verified: 1,
            efficiency: { $multiply: [{ $divide: ['$verified', '$completed'] }, 100] }
          }
        },
        { $sort: { completed: -1 } },
        { $limit: 10 }
      ]);

      const dashboardData = {
        today: {
          patients: todayPatients,
          orders: todayOrders,
          results: todayResults,
          revenue: revenue,
          pendingTests: pendingTests,
          urgentTests: urgentTests,
          criticalResults: criticalResults
        },
        recentOrders,
        testTimeline,
        popularTests,
        monthlyRevenue,
        technicianProductivity
      };

      res.status(200).json(
        new ApiResponse(200, 'Dashboard metrics retrieved successfully', dashboardData)
      );
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  });

  // Get detailed statistics with date range
  getDetailedStatistics = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      } : {};

      const [
        patientStats,
        orderStats,
        resultStats,
        testStats
      ] = await Promise.all([
        Patient.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, count: { $sum: 1 }, totalRevenue: { $sum: '$finalAmount' } } }
        ]),
        Result.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]),
        Test.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, count: { $sum: 1 } } }
        ])
      ]);

      res.status(200).json(
        new ApiResponse(200, 'Detailed statistics retrieved successfully', {
          patients: patientStats,
          orders: orderStats,
          results: resultStats,
          tests: testStats
        })
      );
    } catch (error) {
      console.error('Error fetching detailed statistics:', error);
      throw error;
    }
  });

  // Get test utilization analytics
  getTestUtilization = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, category } = req.query;

      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      } : {};

      const matchStage: any = { ...dateFilter };
      if (category) {
        matchStage['tests.category'] = category;
      }

      const testUtilization = await Order.aggregate([
        { $match: matchStage },
        { $unwind: '$tests' },
        {
          $group: {
            _id: '$tests.testName',
            testCode: { $first: '$tests.testCode' },
            category: { $first: '$tests.category' },
            count: { $sum: 1 },
            revenue: { $sum: '$tests.price' },
            avgPrice: { $avg: '$tests.price' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Test categories distribution
      const categoryDistribution = await Order.aggregate([
        { $match: dateFilter },
        { $unwind: '$tests' },
        {
          $group: {
            _id: '$tests.category',
            count: { $sum: 1 },
            revenue: { $sum: '$tests.price' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.status(200).json(
        new ApiResponse(200, 'Test utilization data retrieved successfully', {
          utilization: testUtilization,
          categories: categoryDistribution
        })
      );
    } catch (error) {
      console.error('Error fetching test utilization:', error);
      throw error;
    }
  });

  // Get revenue analytics
  getRevenueAnalytics = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, period = 'monthly' } = req.query;

      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      } : {
        createdAt: { $gte: moment().subtract(12, 'months').startOf('month') }
      };

      let groupFormat;
      switch (period) {
        case 'daily':
          groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'weekly':
          groupFormat = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
          break;
        case 'yearly':
          groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
          break;
        default:
          groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      }

      const revenueTrend = await Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: groupFormat,
            revenue: { $sum: '$finalAmount' },
            orders: { $sum: 1 },
            avgOrderValue: { $avg: '$finalAmount' },
            paidOrders: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Revenue by test category
      const revenueByCategory = await Order.aggregate([
        { $match: dateFilter },
        { $unwind: '$tests' },
        {
          $group: {
            _id: '$tests.category',
            revenue: { $sum: '$tests.price' },
            count: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]);

      // Top performing tests
      const topTests = await Order.aggregate([
        { $match: dateFilter },
        { $unwind: '$tests' },
        {
          $group: {
            _id: '$tests.testName',
            revenue: { $sum: '$tests.price' },
            count: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);

      res.status(200).json(
        new ApiResponse(200, 'Revenue analytics retrieved successfully', {
          trend: revenueTrend,
          byCategory: revenueByCategory,
          topTests
        })
      );
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  });

  // Get operational metrics
  getOperationalMetrics = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = startDate && endDate ? {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      } : {
        createdAt: { $gte: moment().subtract(30, 'days') }
      };

      // Turnaround time analysis
      const turnaroundAnalysis = await Result.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$test',
            avgTurnaroundTime: { $avg: '$turnaroundTime' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'tests',
            localField: '_id',
            foreignField: '_id',
            as: 'testInfo'
          }
        },
        { $unwind: '$testInfo' },
        {
          $project: {
            testName: '$testInfo.testName',
            category: '$testInfo.category',
            avgTurnaroundTime: { $round: ['$avgTurnaroundTime', 2] },
            count: 1
          }
        },
        { $sort: { avgTurnaroundTime: 1 } }
      ]);

      // Quality metrics
      const qualityMetrics = await Result.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
            critical: { $sum: { $cond: ['$criticalValue', 1, 0] } },
            abnormal: { $sum: { $cond: ['$isAbnormal', 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
          }
        }
      ]);

      // Sample status distribution
      const sampleMetrics = await SampleModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$collectionStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      // Test completion by day
      const dailyCompletion = await Order.aggregate([
        {
          $match: {
            ...dateFilter,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            completed: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const operationalData = {
        turnaroundAnalysis,
        qualityMetrics: qualityMetrics[0] || {},
        sampleMetrics,
        dailyCompletion
      };

      res.status(200).json(
        new ApiResponse(200, 'Operational metrics retrieved successfully', operationalData)
      );
    } catch (error) {
      console.error('Error fetching operational metrics:', error);
      throw error;
    }
  });

  // Export analytics data to Excel
  exportAnalyticsData = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, startDate, endDate } = req.query;

      // This would integrate with a library like exceljs to generate Excel files
      // For now, return the data that would be exported
      let data;

      switch (type) {
        case 'revenue':
          data = await this.getRevenueAnalyticsData(startDate, endDate);
          break;
        case 'tests':
          data = await this.getTestUtilizationData(startDate, endDate);
          break;
        case 'operational':
          data = await this.getOperationalMetricsData(startDate, endDate);
          break;
        default:
          data = await this.getDashboardMetricsData(startDate, endDate);
      }

      res.status(200).json(
        new ApiResponse(200, 'Analytics data ready for export', data)
      );
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  });

  // Helper methods for data export
  private async getRevenueAnalyticsData(startDate?: any, endDate?: any) {
    // Implementation similar to getRevenueAnalytics but optimized for export
    return {};
  }

  private async getTestUtilizationData(startDate?: any, endDate?: any) {
    // Implementation similar to getTestUtilization but optimized for export
    return {};
  }

  private async getOperationalMetricsData(startDate?: any, endDate?: any) {
    // Implementation similar to getOperationalMetrics but optimized for export
    return {};
  }

  private async getDashboardMetricsData(startDate?: any, endDate?: any) {
    // Implementation similar to getDashboardMetrics but optimized for export
    return {};
  }
}

export const analyticsController = new AnalyticsController();