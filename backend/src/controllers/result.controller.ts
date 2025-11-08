import { Request, Response } from 'express';
import { ResultZodSchema } from '../validators/result.validator';
import { ResultService } from '../services/result.service';
import { PdfResultService } from '../services/pdfResult.service';
import { uploadPDFToGridFS, downloadPDFFromGridFS } from '../utils/gridfs';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Result } from '../schemas/result.schema';

const resultService = new ResultService();
const pdfResultService = new PdfResultService();

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

    // Add cache-busting headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

  // Bulk Create Results
  bulkCreateResults = asyncHandler(async (req: Request, res: Response) => {
    const { results } = req.body;
    // @ts-ignore
    const userId = (req.user as any).id;

    const createdResults = await resultService.createBulkResults(results, userId);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Bulk results created successfully', {
        data: createdResults
      })
    );
  });

  // Generate PDF for a specific result
  generateResultPDF = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    const { template = 'cbc-style', includePatientInfo = true, includeLabInfo = true } = req.body;

    console.log(`🔧 [RESULT PDF] Generating PDF for result: ${resultId}`);

    // Fetch the result with related data
    const result = await Result.findById(resultId)
      .populate('patient')
      .populate('order')
      .populate('test')
      .populate('enteredBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .lean();

    if (!result) {
      console.log(`❌ [RESULT PDF] Result not found: ${resultId}`);
      // @ts-ignore
      throw new ApiError(404 as any, 'Result not found');
    }

    console.log(`✅ [RESULT PDF] Result found: ${result.testName}`);

    // Check if PDF already exists for this result
    if (result.pdfFileId) {
      console.log(`🔧 [RESULT PDF] PDF already exists for result: ${resultId}`);
      return res.status(200).json(
        // @ts-ignore
        new ApiResponse(200 as any, 'PDF already exists for this result', {
          pdfFileId: result.pdfFileId,
          message: 'PDF already generated'
        })
      );
    }

    try {
      // Generate PDF with timeout and fallback mechanism
      const pdfGenerationPromise = pdfResultService.generateResultPDF(
        {
          result,
          patient: result.patient,
          order: result.order,
          test: result.test
        },
        {
          template,
          includePatientInfo,
          includeLabInfo
        }
      );

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF generation timeout')), 25000);
      });

      const pdfResult = await Promise.race([pdfGenerationPromise, timeoutPromise]) as any;
      console.log(`✅ [RESULT PDF] PDF generated successfully for result: ${resultId}`);

      // Upload PDF to GridFS with timeout
      let pdfFileId = null;
      try {
        const uploadPromise = uploadPDFToGridFS(pdfResult.fileBuffer, pdfResult.filename, {
          resultId: result._id.toString(),
          template,
          generatedBy: (req.user as any)?.id,
          generatedAt: new Date(),
          fileSize: pdfResult.fileSize
        });

        const uploadTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('GridFS upload timeout')), 20000);
        });

        pdfFileId = await Promise.race([uploadPromise, uploadTimeoutPromise]) as any;
        console.log(`✅ [RESULT PDF] PDF uploaded to GridFS: ${pdfFileId}`);
      } catch (uploadError) {
        console.warn(`⚠️ [RESULT PDF] GridFS upload failed, returning PDF directly:`, uploadError);
        // Return PDF directly if GridFS fails
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.filename}"`);
        res.setHeader('Content-Length', pdfResult.fileSize);
        return res.send(pdfResult.fileBuffer);
      }

      // Update result with PDF file reference
      await Result.findByIdAndUpdate(resultId, {
        pdfFileId,
        pdfGeneration: {
          generatedAt: new Date(),
          pdfVersion: '1.0',
          generationTime: Date.now() - Date.now(),
          templateUsed: template
        }
      });

      console.log(`🔧 [RESULT PDF] Result updated with PDF file ID: ${pdfFileId}`);

      return res.status(200).json(
        // @ts-ignore
        new ApiResponse(200 as any, 'Result PDF generated successfully', {
          pdfFileId,
          filename: pdfResult.filename,
          fileSize: pdfResult.fileSize,
          message: 'PDF generated and saved successfully'
        })
      );

    } catch (error) {
      console.error(`❌ [RESULT PDF] PDF generation failed for result: ${resultId}`, error);
      // @ts-ignore
      throw new ApiError(500 as any, 'Failed to generate result PDF');
    }
  });

  // Download PDF for a specific result
  downloadResultPDF = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    const { template = 'cbc-style' } = req.query;

    // Validate template parameter
    const validTemplates = ['standard', 'compact', 'detailed', 'cbc-style'];
    const selectedTemplate = validTemplates.includes(template as string)
      ? (template as 'standard' | 'compact' | 'detailed' | 'cbc-style')
      : 'cbc-style';

    console.log(`🔧 [RESULT PDF] Downloading PDF for result: ${resultId}`);
    console.log(`🔧 [RESULT PDF] Using template: ${selectedTemplate}`);

    // Fetch the result
    const result = await Result.findById(resultId);

    if (!result) {
      console.log(`❌ [RESULT PDF] Result not found: ${resultId}`);
      // @ts-ignore
      throw new ApiError(404 as any, 'Result not found');
    }

    let pdfBuffer: Buffer;
    let filename: string;

    try {
      if (result.pdfFileId) {
        // Try to download existing PDF from GridFS
        try {
          pdfBuffer = await downloadPDFFromGridFS(result.pdfFileId);
          console.log(`🔧 [RESULT PDF] PDF downloaded from GridFS successfully`);
          filename = `Result_${result.testCode || result.testName}_${new Date().toISOString().split('T')[0]}.pdf`;
        } catch (gridfsError) {
          console.warn(`🔧 [RESULT PDF] GridFS download failed, generating PDF on-demand:`, gridfsError);

          // Generate PDF on-demand if GridFS fails
          const populatedResult = await Result.findById(resultId)
            .populate('patient')
            .populate('order')
            .populate('test')
            .lean();

          const pdfResult = await pdfResultService.generateResultPDF(
            {
              result: populatedResult,
              patient: populatedResult.patient,
              order: populatedResult.order,
              test: populatedResult.test
            },
            { template: selectedTemplate }
          );

          pdfBuffer = pdfResult.fileBuffer;
          filename = pdfResult.filename;
          console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
        }
      } else {
        // Generate PDF on-demand if no PDF exists
        console.log(`🔧 [RESULT PDF] No PDF exists, generating on-demand`);
        const populatedResult = await Result.findById(resultId)
          .populate('patient')
          .populate('order')
          .populate('test')
          .lean();

        const pdfResult = await pdfResultService.generateResultPDF(
          {
            result: populatedResult,
            patient: populatedResult.patient,
            order: populatedResult.order,
            test: populatedResult.test
          },
          { template: selectedTemplate }
        );

        pdfBuffer = pdfResult.fileBuffer;
        filename = pdfResult.filename;
        console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
      }

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`🔧 [RESULT PDF] Sending PDF buffer (${pdfBuffer.length} bytes)`);
      return res.send(pdfBuffer);

    } catch (error) {
      console.error(`❌ [RESULT PDF] Failed to download PDF for result: ${resultId}`, error);
      // @ts-ignore
      throw new ApiError(500 as any, 'Failed to download result PDF');
    }
  });

  // View PDF for a specific result (inline display)
  viewResultPDF = asyncHandler(async (req: Request, res: Response) => {
    const { resultId } = req.params;
    const { template = 'cbc-style' } = req.query;

    // Validate template parameter
    const validTemplates = ['standard', 'compact', 'detailed', 'cbc-style'];
    const selectedTemplate = validTemplates.includes(template as string)
      ? (template as 'standard' | 'compact' | 'detailed' | 'cbc-style')
      : 'cbc-style';

    console.log(`🔧 [RESULT PDF] Viewing PDF for result: ${resultId}`);
    console.log(`🔧 [RESULT PDF] Using template: ${selectedTemplate}`);

    // Fetch the result
    const result = await Result.findById(resultId);

    if (!result) {
      console.log(`❌ [RESULT PDF] Result not found: ${resultId}`);
      // @ts-ignore
      throw new ApiError(404 as any, 'Result not found');
    }

    let pdfBuffer: Buffer;
    let filename: string;

    try {
      if (result.pdfFileId) {
        // Try to download existing PDF from GridFS
        try {
          pdfBuffer = await downloadPDFFromGridFS(result.pdfFileId);
          console.log(`🔧 [RESULT PDF] PDF downloaded from GridFS successfully`);
          filename = `Result_${result.testCode || result.testName}_${new Date().toISOString().split('T')[0]}.pdf`;
        } catch (gridfsError) {
          console.warn(`🔧 [RESULT PDF] GridFS download failed, generating PDF on-demand:`, gridfsError);

          // Generate PDF on-demand if GridFS fails
          const populatedResult = await Result.findById(resultId)
            .populate('patient')
            .populate('order')
            .populate('test')
            .lean();

          const pdfResult = await pdfResultService.generateResultPDF(
            {
              result: populatedResult,
              patient: populatedResult.patient,
              order: populatedResult.order,
              test: populatedResult.test
            },
            { template: selectedTemplate }
          );

          pdfBuffer = pdfResult.fileBuffer;
          filename = pdfResult.filename;
          console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
        }
      } else {
        // Generate PDF on-demand if no PDF exists
        console.log(`🔧 [RESULT PDF] No PDF exists, generating on-demand`);
        const populatedResult = await Result.findById(resultId)
          .populate('patient')
          .populate('order')
          .populate('test')
          .lean();

        const pdfResult = await pdfResultService.generateResultPDF(
          {
            result: populatedResult,
            patient: populatedResult.patient,
            order: populatedResult.order,
            test: populatedResult.test
          },
          { template: selectedTemplate }
        );

        pdfBuffer = pdfResult.fileBuffer;
        filename = pdfResult.filename;
        console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
      }

      // Set appropriate headers for inline PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`🔧 [RESULT PDF] Sending PDF buffer for inline viewing (${pdfBuffer.length} bytes)`);
      return res.send(pdfBuffer);

    } catch (error) {
      console.error(`❌ [RESULT PDF] Failed to view PDF for result: ${resultId}`, error);
      // @ts-ignore
      throw new ApiError(500 as any, 'Failed to view result PDF');
    }
  });
}