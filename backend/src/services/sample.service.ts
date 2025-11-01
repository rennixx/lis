import { Types } from 'mongoose';
import { SampleModel, ISample, SampleStatus, SamplePriority } from '../models/Sample.model';
import { ApiError } from '../utils/ApiError';

export interface CreateSampleRequest {
  orderId: string;
  patientId: string;
  testIds: string[];
  sampleType: string;
  containerType: string;
  volume: number;
  volumeUnit: string;
  collectionMethod?: string;
  scheduledCollectionTime?: Date;
  priority?: SamplePriority;
  collectionNotes?: string;
  createdBy: string;
}

export interface BulkStatusUpdateRequest {
  sampleIds: string[];
  newStatus: SampleStatus;
  notes?: string;
  updatedBy: string;
}

export interface CollectionConfirmationRequest {
  sampleId: string;
  actualVolume?: number;
  collectionNotes?: string;
  collectedBy: string;
}

export interface SampleFilters {
  status?: SampleStatus;
  priority?: SamplePriority;
  sampleType?: string;
  patientId?: string;
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  collectedBy?: string;
  search?: string;
}

export class SampleService {
  /**
   * Create a new sample
   */
  async createSample(data: CreateSampleRequest): Promise<ISample> {
    try {
      const sample = new SampleModel({
        order: new Types.ObjectId(data.orderId),
        patient: new Types.ObjectId(data.patientId),
        tests: data.testIds.map(id => new Types.ObjectId(id)),
        sampleType: data.sampleType,
        containerType: data.containerType,
        volume: data.volume,
        volumeUnit: data.volumeUnit,
        collectionMethod: data.collectionMethod,
        scheduledCollectionTime: data.scheduledCollectionTime,
        priority: data.priority || SamplePriority.ROUTINE,
        collectionNotes: data.collectionNotes,
        createdBy: new Types.ObjectId(data.createdBy)
      });

      return await sample.save();
    } catch (error) {
      throw new ApiError('Failed to create sample', 500);
    }
  }

  /**
   * Get samples with filters and pagination
   */
  async getSamples(
    filters: SampleFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ samples: ISample[]; total: number; pages: number }> {
    try {
      const query: any = {};

      // Build query from filters
      if (filters.status) {
        query.collectionStatus = filters.status;
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      if (filters.sampleType) {
        query.sampleType = filters.sampleType;
      }

      if (filters.patientId) {
        query.patient = new Types.ObjectId(filters.patientId);
      }

      if (filters.orderId) {
        query.order = new Types.ObjectId(filters.orderId);
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.createdAt.$lte = filters.dateTo;
        }
      }

      if (filters.search) {
        query.$or = [
          { sampleId: { $regex: filters.search, $options: 'i' } },
          { barcode: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const samples = await SampleModel.find(query)
        .populate('patient', 'firstName lastName patientId dateOfBirth')
        .populate('order', 'orderNumber priority')
        .populate('tests', 'name code category')
        .populate('collectedBy', 'fullName')
        .populate('processedBy', 'fullName')
        .sort({ priority: -1, scheduledCollectionTime: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await SampleModel.countDocuments(query);
      const pages = Math.ceil(total / limit);

      return { samples, total, pages };
    } catch (error) {
      throw new ApiError('Failed to get samples', 500);
    }
  }

  /**
   * Get sample by ID
   */
  async getSampleById(id: string): Promise<ISample | null> {
    try {
      return await SampleModel.findById(id)
        .populate('patient', 'firstName lastName patientId dateOfBirth phone')
        .populate('order', 'orderNumber priority clinicalNotes')
        .populate('tests', 'name code category description normalRange')
        .populate('collectedBy', 'fullName')
        .populate('receivedBy', 'fullName')
        .populate('processedBy', 'fullName')
        .populate('createdBy', 'fullName')
        .populate('statusHistory.changedBy', 'fullName')
        .populate('qualityChecks.checkedBy', 'fullName')
        .exec();
    } catch (error) {
      throw new ApiError('Failed to get sample', 500);
    }
  }

  /**
   * Get sample by barcode
   */
  async getSampleByBarcode(barcode: string): Promise<ISample | null> {
    try {
      return await SampleModel.findOne({ barcode })
        .populate('patient', 'firstName lastName patientId dateOfBirth')
        .populate('order', 'orderNumber priority')
        .populate('tests', 'name code category')
        .exec();
    } catch (error) {
      throw new ApiError('Failed to get sample by barcode', 500);
    }
  }

  /**
   * Get pending collections queue
   */
  async getPendingCollectionsQueue(limit: number = 50): Promise<ISample[]> {
    try {
      return await SampleModel.find({
        collectionStatus: { $in: ['pending', 'collected'] }
      })
        .populate('patient', 'firstName lastName patientId dateOfBirth')
        .populate('order', 'orderNumber priority')
        .populate('tests', 'name code category')
        .sort({ priority: -1, scheduledCollectionTime: 1 })
        .limit(limit)
        .exec();
    } catch (error) {
      throw new ApiError('Failed to get pending collections', 500);
    }
  }

  /**
   * Confirm sample collection
   */
  async confirmCollection(data: CollectionConfirmationRequest): Promise<ISample> {
    try {
      const sample = await SampleModel.findById(data.sampleId);
      if (!sample) {
        throw new ApiError('Sample not found', 404);
      }

      if (sample.collectionStatus !== 'pending') {
        throw new ApiError('Sample has already been collected', 400);
      }

      // Update sample with collection details
      sample.actualCollectionTime = new Date();
      sample.collectedBy = new Types.ObjectId(data.collectedBy);
      sample.collectionStatus = SampleStatus.COLLECTED;

      if (data.actualVolume !== undefined) {
        sample.volume = data.actualVolume;
      }

      if (data.collectionNotes) {
        sample.collectionNotes = data.collectionNotes;
      }

      // Add to status history
      (sample.statusHistory as any[]).push({
        status: SampleStatus.COLLECTED,
        changedBy: new Types.ObjectId(data.collectedBy),
        changedAt: new Date(),
        notes: data.collectionNotes || 'Sample collected successfully'
      });

      // Set expiry date (7 days from collection)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      sample.expiryDate = expiryDate;

      return await sample.save();
    } catch (error) {
      throw new ApiError('Failed to confirm collection', 500);
    }
  }

  /**
   * Bulk update sample status
   */
  async bulkUpdateStatus(data: BulkStatusUpdateRequest): Promise<{ modifiedCount: number }> {
    try {
      const sampleObjectIds = data.sampleIds.map(id => new Types.ObjectId(id));

      const result = await SampleModel.updateMany(
        { _id: { $in: sampleObjectIds } },
        {
          collectionStatus: data.newStatus,
          lastModifiedBy: new Types.ObjectId(data.updatedBy),
          $push: {
            statusHistory: {
              status: data.newStatus,
              changedBy: new Types.ObjectId(data.updatedBy),
              changedAt: new Date(),
              notes: data.notes
            }
          }
        }
      );

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError('Failed to bulk update sample status', 500);
    }
  }

  /**
   * Receive samples (mark as received in lab)
   */
  async receiveSamples(
    sampleIds: string[],
    receivedBy: string,
    notes?: string
  ): Promise<{ modifiedCount: number }> {
    try {
      const sampleObjectIds = sampleIds.map(id => new Types.ObjectId(id));

      const result = await SampleModel.updateMany(
        {
          _id: { $in: sampleObjectIds },
          collectionStatus: SampleStatus.COLLECTED
        },
        {
          collectionStatus: SampleStatus.IN_PROCESS,
          receivedTime: new Date(),
          receivedBy: new Types.ObjectId(receivedBy),
          $push: {
            statusHistory: {
              status: SampleStatus.IN_PROCESS,
              changedBy: new Types.ObjectId(receivedBy),
              changedAt: new Date(),
              notes: notes || 'Sample received in laboratory'
            }
          }
        }
      );

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError('Failed to receive samples', 500);
    }
  }

  /**
   * Start processing samples
   */
  async startProcessing(
    sampleIds: string[],
    processedBy: string,
    notes?: string
  ): Promise<{ modifiedCount: number }> {
    try {
      const sampleObjectIds = sampleIds.map(id => new Types.ObjectId(id));

      const result = await SampleModel.updateMany(
        {
          _id: { $in: sampleObjectIds },
          collectionStatus: SampleStatus.IN_PROCESS
        },
        {
          collectionStatus: SampleStatus.PROCESSING,
          processingStartTime: new Date(),
          processedBy: new Types.ObjectId(processedBy),
          $push: {
            statusHistory: {
              status: SampleStatus.PROCESSING,
              changedBy: new Types.ObjectId(processedBy),
              changedAt: new Date(),
              notes: notes || 'Processing started'
            }
          }
        }
      );

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError('Failed to start processing', 500);
    }
  }

  /**
   * Complete sample processing
   */
  async completeProcessing(
    sampleIds: string[],
    completedBy: string,
    notes?: string
  ): Promise<{ modifiedCount: number }> {
    try {
      const sampleObjectIds = sampleIds.map(id => new Types.ObjectId(id));

      const result = await SampleModel.updateMany(
        {
          _id: { $in: sampleObjectIds },
          collectionStatus: SampleStatus.PROCESSING
        },
        {
          collectionStatus: SampleStatus.COMPLETED,
          processingEndTime: new Date(),
          $push: {
            statusHistory: {
              status: SampleStatus.COMPLETED,
              changedBy: new Types.ObjectId(completedBy),
              changedAt: new Date(),
              notes: notes || 'Processing completed'
            }
          }
        }
      );

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError('Failed to complete processing', 500);
    }
  }

  /**
   * Get samples by status counts for dashboard
   */
  async getSamplesByStatusCounts(): Promise<any> {
    try {
      const pipeline = [
        {
          $group: {
            _id: '$collectionStatus',
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            totalSamples: { $sum: '$count' },
            statusCounts: {
              $push: {
                status: '$_id',
                count: '$count'
              }
            }
          }
        }
      ];

      const result = await SampleModel.aggregate(pipeline);
      return result[0] || { totalSamples: 0, statusCounts: [] };
    } catch (error) {
      throw new ApiError('Failed to get status counts', 500);
    }
  }

  /**
   * Search samples by various criteria
   */
  async searchSamples(query: string, limit: number = 20): Promise<ISample[]> {
    try {
      const searchRegex = new RegExp(query, 'i');

      return await SampleModel.find({
        $or: [
          { sampleId: searchRegex },
          { barcode: searchRegex },
          { collectionNotes: searchRegex }
        ]
      })
        .populate('patient', 'firstName lastName patientId')
        .populate('order', 'orderNumber')
        .limit(limit)
        .exec();
    } catch (error) {
      throw new ApiError('Failed to search samples', 500);
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStatistics(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchStage = dateRange ? {
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      } : {};

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$collectionStatus',
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            totalSamples: { $sum: '$count' },
            statusBreakdown: {
              $push: {
                status: '$_id',
                count: '$count'
              }
            }
          }
        }
      ];

      const result = await SampleModel.aggregate(pipeline);
      return result[0] || { totalSamples: 0, statusBreakdown: [] };
    } catch (error) {
      throw new ApiError('Failed to get collection statistics', 500);
    }
  }
}