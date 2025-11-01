import { Request, Response } from 'express';
import { SampleService } from '../services/sample.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const sampleService = new SampleService();

export class SampleController {
  /**
   * Create new sample
   */
  createSample = asyncHandler(async (req: Request, res: Response) => {
    const sampleData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const sample = await sampleService.createSample(sampleData);

    return ApiResponse.success(res, 'Sample created successfully', {
      data: sample
    }, 201);
  });

  /**
   * Get all samples with filters and pagination
   */
  getSamples = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      sampleType,
      patientId,
      orderId,
      dateFrom,
      dateTo,
      collectedBy,
      search
    } = req.query;

    const filters: any = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (sampleType) filters.sampleType = sampleType;
    if (patientId) filters.patientId = patientId as string;
    if (orderId) filters.orderId = orderId as string;
    if (collectedBy) filters.collectedBy = collectedBy as string;
    if (search) filters.search = search as string;

    if (dateFrom || dateTo) {
      filters.dateFrom = dateFrom ? new Date(dateFrom as string) : undefined;
      filters.dateTo = dateTo ? new Date(dateTo as string) : undefined;
    }

    const result = await sampleService.getSamples(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return ApiResponse.success(res, 'Samples retrieved successfully', {
      data: result.samples,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: result.pages
      }
    });
  });

  /**
   * Get sample by ID
   */
  getSampleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const sample = await sampleService.getSampleById(id);

    if (!sample) {
      throw new ApiError('Sample not found', 404);
    }

    return ApiResponse.success(res, 'Sample retrieved successfully', {
      data: sample
    });
  });

  /**
   * Get sample by barcode
   */
  getSampleByBarcode = asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;

    const sample = await sampleService.getSampleByBarcode(barcode);

    if (!sample) {
      throw new ApiError('Sample not found', 404);
    }

    return ApiResponse.success(res, 'Sample retrieved successfully', {
      data: sample
    });
  });

  /**
   * Get pending collections queue
   */
  getPendingCollectionsQueue = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50 } = req.query;

    const samples = await sampleService.getPendingCollectionsQueue(
      parseInt(limit as string)
    );

    return ApiResponse.success(res, 'Pending collections retrieved successfully', {
      data: samples
    });
  });

  /**
   * Confirm sample collection
   */
  confirmCollection = asyncHandler(async (req: Request, res: Response) => {
    const { sampleId } = req.params;
    const collectionData = {
      ...req.body,
      collectedBy: req.user?.id
    };

    const sample = await sampleService.confirmCollection({
      sampleId,
      ...collectionData
    });

    return ApiResponse.success(res, 'Sample collection confirmed successfully', {
      data: sample
    });
  });

  /**
   * Bulk update sample status
   */
  bulkUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { sampleIds, newStatus, notes } = req.body;

    const result = await sampleService.bulkUpdateStatus({
      sampleIds,
      newStatus,
      notes,
      updatedBy: req.user?.id || ''
    });

    return ApiResponse.success(res, 'Sample statuses updated successfully', {
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} samples updated`
      }
    });
  });

  /**
   * Receive samples in laboratory
   */
  receiveSamples = asyncHandler(async (req: Request, res: Response) => {
    const { sampleIds, notes } = req.body;

    const result = await sampleService.receiveSamples(
      sampleIds,
      req.user?.id || '',
      notes
    );

    return ApiResponse.success(res, 'Samples received successfully', {
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} samples received`
      }
    });
  });

  /**
   * Start processing samples
   */
  startProcessing = asyncHandler(async (req: Request, res: Response) => {
    const { sampleIds, notes } = req.body;

    const result = await sampleService.startProcessing(
      sampleIds,
      req.user?.id || '',
      notes
    );

    return ApiResponse.success(res, 'Processing started successfully', {
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} samples started processing`
      }
    });
  });

  /**
   * Complete sample processing
   */
  completeProcessing = asyncHandler(async (req: Request, res: Response) => {
    const { sampleIds, notes } = req.body;

    const result = await sampleService.completeProcessing(
      sampleIds,
      req.user?.id || '',
      notes
    );

    return ApiResponse.success(res, 'Processing completed successfully', {
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} samples completed`
      }
    });
  });

  /**
   * Search samples
   */
  searchSamples = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 20 } = req.query;

    if (!q) {
      throw new ApiError('Search query is required', 400);
    }

    const samples = await sampleService.searchSamples(
      q as string,
      parseInt(limit as string)
    );

    return ApiResponse.success(res, 'Samples found', {
      data: samples
    });
  });

  /**
   * Get collection statistics
   */
  getCollectionStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const stats = await sampleService.getCollectionStatistics(dateRange);

    return ApiResponse.success(res, 'Collection statistics retrieved successfully', {
      data: stats
    });
  });

  /**
   * Get samples by status counts for dashboard
   */
  getSamplesByStatusCounts = asyncHandler(async (req: Request, res: Response) => {
    const counts = await sampleService.getSamplesByStatusCounts();

    return ApiResponse.success(res, 'Sample status counts retrieved successfully', {
      data: counts
    });
  });

  /**
   * Generate barcode for sample
   */
  generateBarcode = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const sample = await sampleService.getSampleById(id);
    if (!sample) {
      throw new ApiError('Sample not found', 404);
    }

    return ApiResponse.success(res, 'Barcode retrieved successfully', {
      data: {
        sampleId: sample.sampleId,
        barcode: sample.barcode,
        sampleType: sample.sampleType,
        collectionDate: sample.actualCollectionTime || sample.scheduledCollectionTime
      }
    });
  });

  /**
   * Print sample labels
   */
  printSampleLabels = asyncHandler(async (req: Request, res: Response) => {
    const { sampleIds } = req.body;

    const samples = await Promise.all(
      sampleIds.map((id: string) => sampleService.getSampleById(id))
    );

    const validSamples = samples.filter(sample => sample !== null);

    const labels = validSamples.map(sample => ({
      sampleId: sample!.sampleId,
      barcode: sample!.barcode,
      sampleType: sample!.sampleType,
      priority: sample!.priority,
      collectionDate: sample!.actualCollectionTime || sample!.scheduledCollectionTime
    }));

    return ApiResponse.success(res, 'Sample labels generated successfully', {
      data: {
        labels,
        count: labels.length
      }
    });
  });
}