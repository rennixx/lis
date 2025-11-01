import { Request, Response } from 'express';
import { ResultZodSchema } from '../validators/result.validator';
import { ResultService } from '../services/result.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const resultService = new ResultService();

export class ResultController {
  // Create Result
  createResult = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = ResultZodSchema.create.parse(req.body);
    // @ts-ignore
    (validatedData as any).enteredBy = (req.user as any).id;

    const result = await resultService.createResult(validatedData);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Result created successfully', {
        data: result
      })
    );
  });

  // Get All Results
  getAllResults = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      patientId,
      testId,
      orderId,
      criticalValue,
      isAbnormal,
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
      patientId: patientId as string,
      testId: testId as string,
      orderId: orderId as string,
      criticalValue: criticalValue === 'true' ? true : criticalValue === 'false' ? false : undefined,
      isAbnormal: isAbnormal === 'true' ? true : isAbnormal === 'false' ? false : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await resultService.getAllResults(filters);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Results retrieved successfully', {
        data: {
          results: result.results,
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

  // Get Result by ID
  getResultById = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;

    const result = await resultService.getResultById(resultId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Result retrieved successfully', {
        data: result
      })
    );
  });

  // Update Result
  updateResult = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    const validatedData = ResultZodSchema.update.parse(req.body);

    const updatedResult = await resultService.updateResult(resultId, validatedData);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Result updated successfully', {
        data: updatedResult
      })
    );
  });

  // Update Result Value
  updateResultValue = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    // @ts-ignore
    const { value } = (ResultZodSchema as any).updateValue.parse(req.body);
    const userId = (req.user as any).id;

    const result = await resultService.updateResultValue(resultId, value, userId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Result value updated successfully', {
        data: result
      })
    );
  });

  // Verify Result
  verifyResult = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    const userId = (req.user as any).id;
    const userName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;

    const result = await resultService.verifyResult(resultId, userId, userName);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Result verified successfully', {
        data: result
      })
    );
  });

  // Reject Result
  rejectResult = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    const { reason } = ResultZodSchema.reject.parse(req.body);
    const userId = (req.user as any).id;

    const result = await resultService.rejectResult(resultId, userId, reason);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Result rejected successfully', {
        data: result
      })
    );
  });

  // Mark Result as Critical
  markAsCritical = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;

    const result = await resultService.markResultAsCritical(resultId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Result marked as critical', {
        data: result
      })
    );
  });

  // Get Results by Order
  getResultsByOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const results = await resultService.getResultsByOrder(orderId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Results by order retrieved', {
        data: results
      })
    );
  });

  // Get Results by Patient
  getResultsByPatient = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { limit = 100 } = req.query;

    const results = await resultService.getResultsByPatient(
      patientId,
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Results by patient retrieved', {
        data: results
      })
    );
  });

  // Get Critical Results
  getCriticalResults = asyncHandler(async (req: Request, res: Response) => {
    const results = await resultService.getCriticalResults();

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Critical results retrieved', {
        data: results
      })
    );
  });

  // Get Abnormal Results
  getAbnormalResults = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50 } = req.query;

    const results = await resultService.getAbnormalResults(
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Abnormal results retrieved', {
        data: results
      })
    );
  });

  // Get Results for Review
  getResultsForReview = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20 } = req.query;

    const results = await resultService.getResultsForReview(
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Results for review retrieved', {
        data: results
      })
    );
  });

  // Bulk Verify Results
  bulkVerifyResults = asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    const { resultIds } = (ResultZodSchema as any).bulkVerify.parse(req.body);
    const userId = (req.user as any).id;
    const userName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;

    const result = await resultService.bulkVerifyResults(resultIds, userId, userName);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Results verified successfully', {
        data: result
      })
    );
  });

  // Bulk Reject Results
  bulkRejectResults = asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    const { resultIds, reason } = (ResultZodSchema as any).bulkReject.parse(req.body);
    const userId = (req.user as any).id;

    const result = await resultService.bulkRejectResults(resultIds, userId, reason);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Results rejected successfully', {
        data: result
      })
    );
  });

  // Add Comment to Result
  addComment = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    // @ts-ignore
    const { comment } = (ResultZodSchema as any).addComment.parse(req.body);

    const result = await resultService.addCommentToResult(resultId, comment);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Comment added successfully', {
        data: result
      })
    );
  });

  // Get Result Statistics
  getResultStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const statistics = await resultService.getResultStatistics(dateRange);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Result statistics retrieved', {
        data: statistics
      })
    );
  });

  // Search Results
  searchResults = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 20 } = req.query;

    if (!q) {
      // @ts-ignore
      throw new ApiError(400 as any, 'Search query is required');
    }

    const results = await resultService.searchResults(q as string, parseInt(limit as string));

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Results search completed', {
        data: results
      })
    );
  });
}