import { Request, Response } from 'express';
import { TestZodSchema } from '../validators/test.validator';
import { TestService } from '../services/test.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const testService = new TestService();

export class TestController {
  // Create Test
  createTest = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = TestZodSchema.create.parse(req.body);

    // @ts-ignore
    const test = await testService.createTest(validatedData as any);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Test created successfully', {
        data: test
      })
    );
  });

  // Get All Tests
  getAllTests = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      department,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      category: category as string,
      department: department as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await testService.getAllTests(filters);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tests retrieved successfully', {
        data: {
          tests: result.tests,
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

  // Get Test by ID
  getTestById = asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;

    const test = await testService.getTestById(testId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test retrieved successfully', {
        data: test
      })
    );
  });

  // Get Test by Code
  getTestByCode = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    const test = await testService.getTestByCode(code);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test retrieved successfully', {
        data: test
      })
    );
  });

  // Update Test
  updateTest = asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    const validatedData = TestZodSchema.update.parse(req.body);

    // @ts-ignore
    const updatedTest = await testService.updateTest(testId, validatedData as any);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test updated successfully', {
        data: updatedTest
      })
    );
  });

  // Delete Test (Soft Delete)
  deleteTest = asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;

    await testService.deleteTest(testId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test deleted successfully')
    );
  });

  // Search Tests
  searchTests = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 10 } = req.query;

    if (!q) {
      // @ts-ignore
      throw new ApiError(400 as any, 'Search query is required');
    }

    const tests = await testService.searchTests(q as string, parseInt(limit as string));

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tests search completed', {
        data: tests
      })
    );
  });

  // Get Tests by Category
  getTestsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;

    const tests = await testService.getTestsByCategory(category);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tests by category retrieved', {
        data: tests
      })
    );
  });

  // Get All Categories
  getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await testService.getAllCategories();

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Categories retrieved', {
        data: categories
      })
    );
  });

  // Get Test Statistics
  getTestStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await testService.getTestStatistics();

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test statistics retrieved', {
        data: statistics
      })
    );
  });

  // Get Popular Tests
  getPopularTests = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query;

    const tests = await testService.getPopularTests(parseInt(limit as string));

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Popular tests retrieved', {
        data: tests
      })
    );
  });

  // Update Test Price
  updateTestPrice = asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    const { price } = TestZodSchema.updatePrice.parse(req.body);

    const test = await testService.updateTestPrice(testId, price);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test price updated successfully', {
        data: {
          id: test.id,
          name: test.name,
          code: test.code,
          price: test.price
        }
      })
    );
  });

  // Add Test Parameter
  addTestParameter = asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    const validatedData = TestZodSchema.addParameter.parse(req.body);

    const test = await testService.addTestParameter(testId, validatedData);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test parameter added successfully', {
        data: test
      })
    );
  });

  // Update Test Parameter
  updateTestParameter = asyncHandler(async (req: Request, res: Response) => {
    const { testId, paramIndex } = req.params;
    const validatedData = TestZodSchema.updateParameter.parse(req.body);

    const test = await testService.updateTestParameter(
      testId,
      parseInt(paramIndex),
      validatedData
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test parameter updated successfully', {
        data: test
      })
    );
  });

  // Remove Test Parameter
  removeTestParameter = asyncHandler(async (req: Request, res: Response) => {
    const { testId, paramIndex } = req.params;

    const test = await testService.removeTestParameter(
      testId,
      parseInt(paramIndex)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test parameter removed successfully', {
        data: test
      })
    );
  });

  // Get Test with Parameters
  getTestWithParameters = asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;

    const test = await testService.getTestWithParameters(testId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test with parameters retrieved', {
        data: test
      })
    );
  });

  // Get Tests by Department
  getTestsByDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { department } = req.params;

    const tests = await testService.getTestsByDepartment(department);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tests by department retrieved', {
        data: tests
      })
    );
  });

  // Get All Departments
  getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
    const departments = await testService.getAllDepartments();

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Departments retrieved', {
        data: departments
      })
    );
  });

  // Get Tests by Price Range
  getTestsByPriceRange = asyncHandler(async (req: Request, res: Response) => {
    const { minPrice, maxPrice } = TestZodSchema.priceRange.parse(req.query);

    const tests = await testService.getTestsByPriceRange(
      parseFloat(minPrice),
      parseFloat(maxPrice)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tests by price range retrieved', {
        data: tests
      })
    );
  });

  // Search by Specimen Type
  searchBySpecimenType = asyncHandler(async (req: Request, res: Response) => {
    const { specimenType } = req.params;

    const tests = await testService.searchBySpecimenType(specimenType);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tests by specimen type retrieved', {
        data: tests
      })
    );
  });

  // Get All Specimen Types
  getAllSpecimenTypes = asyncHandler(async (req: Request, res: Response) => {
    const specimenTypes = await testService.getAllSpecimenTypes();

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Specimen types retrieved', {
        data: specimenTypes
      })
    );
  });

  // Bulk Update Test Prices
  bulkUpdatePrices = asyncHandler(async (req: Request, res: Response) => {
    const { updates } = TestZodSchema.bulkUpdatePrices.parse(req.body);

    // @ts-ignore
    const result = await testService.bulkUpdatePrices(updates as any);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Test prices updated successfully', {
        data: result
      })
    );
  });

  // Duplicate Test
  duplicateTest = asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    const { newName, newCode } = TestZodSchema.duplicate.parse(req.body);

    const test = await testService.duplicateTest(testId, newName, newCode);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Test duplicated successfully', {
        data: test
      })
    );
  });

  // Get Available Tests for Order Creation
  getAvailableTests = asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      search,
      sortBy = 'testName',
      sortOrder = 'asc'
    } = req.query;

    const filters = {
      category: category as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string
    };

    const tests = await testService.getAvailableTests(filters);

    return ApiResponse.success(res, 'Available tests retrieved successfully', tests);
  });

  // Get Popular Test Panels
  getPopularPanels = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query;

    const panels = await testService.getPopularPanels(parseInt(limit as string));

    return ApiResponse.success(res, 'Popular panels retrieved successfully', panels);
  });
}