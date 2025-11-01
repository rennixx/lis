"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const test_validator_1 = require("../validators/test.validator");
const test_service_1 = require("../services/test.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const testService = new test_service_1.TestService();
class TestController {
    constructor() {
        this.createTest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const validatedData = test_validator_1.TestZodSchema.create.parse(req.body);
            const test = await testService.createTest(validatedData);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Test created successfully', {
                data: test
            }));
        });
        this.getAllTests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, search, category, department, isActive, sortBy = 'name', sortOrder = 'asc' } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                category: category,
                department: department,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await testService.getAllTests(filters);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tests retrieved successfully', {
                data: {
                    tests: result.tests,
                    pagination: {
                        page: filters.page,
                        limit: filters.limit,
                        total: result.total,
                        pages: Math.ceil(result.total / filters.limit)
                    }
                }
            }));
        });
        this.getTestById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId } = req.params;
            const test = await testService.getTestById(testId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test retrieved successfully', {
                data: test
            }));
        });
        this.getTestByCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { code } = req.params;
            const test = await testService.getTestByCode(code);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test retrieved successfully', {
                data: test
            }));
        });
        this.updateTest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId } = req.params;
            const validatedData = test_validator_1.TestZodSchema.update.parse(req.body);
            const updatedTest = await testService.updateTest(testId, validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test updated successfully', {
                data: updatedTest
            }));
        });
        this.deleteTest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId } = req.params;
            await testService.deleteTest(testId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test deleted successfully'));
        });
        this.searchTests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { q, limit = 10 } = req.query;
            if (!q) {
                throw new ApiError_1.ApiError(400, 'Search query is required');
            }
            const tests = await testService.searchTests(q, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tests search completed', {
                data: tests
            }));
        });
        this.getTestsByCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { category } = req.params;
            const tests = await testService.getTestsByCategory(category);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tests by category retrieved', {
                data: tests
            }));
        });
        this.getAllCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const categories = await testService.getAllCategories();
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Categories retrieved', {
                data: categories
            }));
        });
        this.getTestStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const statistics = await testService.getTestStatistics();
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test statistics retrieved', {
                data: statistics
            }));
        });
        this.getPopularTests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { limit = 10 } = req.query;
            const tests = await testService.getPopularTests(parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Popular tests retrieved', {
                data: tests
            }));
        });
        this.updateTestPrice = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId } = req.params;
            const { price } = test_validator_1.TestZodSchema.updatePrice.parse(req.body);
            const test = await testService.updateTestPrice(testId, price);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test price updated successfully', {
                data: {
                    id: test.id,
                    name: test.name,
                    code: test.code,
                    price: test.price
                }
            }));
        });
        this.addTestParameter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId } = req.params;
            const validatedData = test_validator_1.TestZodSchema.addParameter.parse(req.body);
            const test = await testService.addTestParameter(testId, validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test parameter added successfully', {
                data: test
            }));
        });
        this.updateTestParameter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId, paramIndex } = req.params;
            const validatedData = test_validator_1.TestZodSchema.updateParameter.parse(req.body);
            const test = await testService.updateTestParameter(testId, parseInt(paramIndex), validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test parameter updated successfully', {
                data: test
            }));
        });
        this.removeTestParameter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId, paramIndex } = req.params;
            const test = await testService.removeTestParameter(testId, parseInt(paramIndex));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test parameter removed successfully', {
                data: test
            }));
        });
        this.getTestWithParameters = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId } = req.params;
            const test = await testService.getTestWithParameters(testId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test with parameters retrieved', {
                data: test
            }));
        });
        this.getTestsByDepartment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { department } = req.params;
            const tests = await testService.getTestsByDepartment(department);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tests by department retrieved', {
                data: tests
            }));
        });
        this.getAllDepartments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const departments = await testService.getAllDepartments();
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Departments retrieved', {
                data: departments
            }));
        });
        this.getTestsByPriceRange = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { minPrice, maxPrice } = test_validator_1.TestZodSchema.priceRange.parse(req.query);
            const tests = await testService.getTestsByPriceRange(parseFloat(minPrice), parseFloat(maxPrice));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tests by price range retrieved', {
                data: tests
            }));
        });
        this.searchBySpecimenType = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { specimenType } = req.params;
            const tests = await testService.searchBySpecimenType(specimenType);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tests by specimen type retrieved', {
                data: tests
            }));
        });
        this.getAllSpecimenTypes = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const specimenTypes = await testService.getAllSpecimenTypes();
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Specimen types retrieved', {
                data: specimenTypes
            }));
        });
        this.bulkUpdatePrices = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { updates } = test_validator_1.TestZodSchema.bulkUpdatePrices.parse(req.body);
            const result = await testService.bulkUpdatePrices(updates);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Test prices updated successfully', {
                data: result
            }));
        });
        this.duplicateTest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { testId } = req.params;
            const { newName, newCode } = test_validator_1.TestZodSchema.duplicate.parse(req.body);
            const test = await testService.duplicateTest(testId, newName, newCode);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Test duplicated successfully', {
                data: test
            }));
        });
        this.getAvailableTests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { category, search, sortBy = 'testName', sortOrder = 'asc' } = req.query;
            const filters = {
                category: category,
                search: search,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const tests = await testService.getAvailableTests(filters);
            return ApiResponse_1.ApiResponse.success(res, 'Available tests retrieved successfully', tests);
        });
        this.getPopularPanels = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { limit = 10 } = req.query;
            const panels = await testService.getPopularPanels(parseInt(limit));
            return ApiResponse_1.ApiResponse.success(res, 'Popular panels retrieved successfully', panels);
        });
    }
}
exports.TestController = TestController;
