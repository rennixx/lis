"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const Test_model_1 = require("../models/Test.model");
const generateID_1 = require("../utils/generateID");
const mongoose_1 = require("mongoose");
const ApiError_1 = require("../utils/ApiError");
class TestService {
    async createTest(data, session) {
        try {
            let testCode = data.code;
            if (!testCode) {
                testCode = await generateID_1.IDGenerator.generateTestCode();
            }
            const testData = {
                ...data,
                code: testCode.toUpperCase(),
                isActive: true
            };
            const test = session
                ? await Test_model_1.Test.create([testData], { session })
                : await Test_model_1.Test.create(testData);
            return Array.isArray(test) ? test[0] : test;
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to create test: ${error.message}`);
        }
    }
    async getAllTests(filters) {
        try {
            const { page = 1, limit = 10, search, category, department, specimen, minPrice, maxPrice, isActive, sortBy = 'name', sortOrder = 'asc' } = filters;
            const queryFilters = {};
            if (category)
                queryFilters.category = category;
            if (department)
                queryFilters.department = department;
            if (specimen)
                queryFilters.specimen = specimen;
            if (typeof isActive === 'boolean')
                queryFilters.isActive = isActive;
            if (minPrice !== undefined || maxPrice !== undefined) {
                queryFilters.price = {};
                if (minPrice !== undefined)
                    queryFilters.price.$gte = minPrice;
                if (maxPrice !== undefined)
                    queryFilters.price.$lte = maxPrice;
            }
            const paginationFilters = {
                ...queryFilters,
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                sortBy,
                sortOrder
            };
            const [tests, total] = await Promise.all([
                Test_model_1.Test.findAll(paginationFilters),
                Test_model_1.Test.countDocuments(queryFilters)
            ]);
            return {
                tests,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            };
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch tests: ${error.message}`);
        }
    }
    async getTestById(id) {
        try {
            const test = await Test_model_1.Test.findById(id);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to fetch test: ${error.message}`);
        }
    }
    async getTestByCode(code) {
        try {
            const test = await Test_model_1.Test.findByCode(code);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to fetch test: ${error.message}`);
        }
    }
    async updateTest(id, data, session) {
        try {
            const test = session
                ? await Test_model_1.Test.updateById(id, { ...data, updatedAt: new Date() })
                : await Test_model_1.Test.updateById(id, { ...data, updatedAt: new Date() });
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to update test: ${error.message}`);
        }
    }
    async deleteTest(id, session) {
        try {
            const test = session
                ? await Test_model_1.Test.deleteById(id)
                : await Test_model_1.Test.deleteById(id);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to delete test: ${error.message}`);
        }
    }
    async searchTests(query, limit = 10) {
        try {
            return await Test_model_1.Test.searchTests(query, limit);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to search tests: ${error.message}`);
        }
    }
    async getTestsByCategory(category) {
        try {
            return await Test_model_1.Test.getTestsByCategory(category);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch tests by category: ${error.message}`);
        }
    }
    async getAllCategories() {
        try {
            return await Test_model_1.Test.getAllCategories();
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch categories: ${error.message}`);
        }
    }
    async getTestStatistics() {
        try {
            return await Test_model_1.Test.getTestStatistics();
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch test statistics: ${error.message}`);
        }
    }
    async getPopularTests(limit = 10) {
        try {
            return await Test_model_1.Test.getPopularTests(limit);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch popular tests: ${error.message}`);
        }
    }
    async updateTestPrice(id, price) {
        try {
            const test = await Test_model_1.Test.updateTestPrice(id, price);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to update test price: ${error.message}`);
        }
    }
    async addTestParameter(id, parameter) {
        try {
            const test = await Test_model_1.Test.addTestParameter(id, parameter);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to add test parameter: ${error.message}`);
        }
    }
    async updateTestParameter(id, paramIndex, parameter) {
        try {
            const test = await Test_model_1.Test.updateTestParameter(id, paramIndex, parameter);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to update test parameter: ${error.message}`);
        }
    }
    async removeTestParameter(id, paramIndex) {
        try {
            const test = await Test_model_1.Test.removeTestParameter(id, paramIndex);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to remove test parameter: ${error.message}`);
        }
    }
    async getTestWithParameters(id) {
        try {
            const test = await Test_model_1.Test.getTestWithParameters(id);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to fetch test with parameters: ${error.message}`);
        }
    }
    async getTestsByDepartment(department) {
        try {
            return await Test_model_1.Test.getTestsByDepartment(department);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch tests by department: ${error.message}`);
        }
    }
    async getAllDepartments() {
        try {
            return await Test_model_1.Test.getAllDepartments();
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch departments: ${error.message}`);
        }
    }
    async updateTestNormalRange(id, range) {
        try {
            const test = await Test_model_1.Test.updateTestNormalRange(id, range);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to update test normal range: ${error.message}`);
        }
    }
    async getTestsByPriceRange(min, max) {
        try {
            return await Test_model_1.Test.getTestsWithPriceRange(min, max);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch tests by price range: ${error.message}`);
        }
    }
    async searchBySpecimenType(specimen) {
        try {
            return await Test_model_1.Test.searchBySpecimenType(specimen);
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to search tests by specimen: ${error.message}`);
        }
    }
    async getAllSpecimenTypes() {
        try {
            return await Test_model_1.Test.getAllSpecimenTypes();
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Failed to fetch specimen types: ${error.message}`);
        }
    }
    async bulkUpdatePrices(updates) {
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const result = await Test_model_1.Test.bulkUpdatePrices(updates);
            await session.commitTransaction();
            session.endSession();
            return result;
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError_1.ApiError(500, `Bulk price update failed: ${error.message}`);
        }
    }
    async duplicateTest(id, newName, newCode) {
        try {
            if (!newCode) {
                newCode = await generateID_1.IDGenerator.generateTestCode();
            }
            const test = await Test_model_1.Test.duplicateTest(id, newName, newCode);
            if (!test) {
                throw new ApiError_1.ApiError(404, 'Original test not found');
            }
            return test;
        }
        catch (error) {
            if (error instanceof ApiError_1.ApiError)
                throw error;
            throw new ApiError_1.ApiError(500, `Failed to duplicate test: ${error.message}`);
        }
    }
    async advancedSearch(criteria) {
        try {
            const { categories, departments, specimenTypes, priceRange, turnaroundTime, hasParameters, keywords, limit = 20 } = criteria;
            const matchQuery = { isActive: true };
            if (categories && categories.length > 0) {
                matchQuery.category = { $in: categories };
            }
            if (departments && departments.length > 0) {
                matchQuery.department = { $in: departments };
            }
            if (specimenTypes && specimenTypes.length > 0) {
                matchQuery.specimen = { $in: specimenTypes };
            }
            if (priceRange) {
                matchQuery.price = {};
                if (priceRange.min !== undefined)
                    matchQuery.price.$gte = priceRange.min;
                if (priceRange.max !== undefined)
                    matchQuery.price.$lte = priceRange.max;
            }
            if (turnaroundTime) {
                matchQuery.turnaroundTime = {};
                if (turnaroundTime.min !== undefined)
                    matchQuery.turnaroundTime.$gte = turnaroundTime.min;
                if (turnaroundTime.max !== undefined)
                    matchQuery.turnaroundTime.$lte = turnaroundTime.max;
            }
            if (hasParameters === true) {
                matchQuery.testParameters = { $exists: true, $ne: [] };
            }
            else if (hasParameters === false) {
                matchQuery.$or = [
                    { testParameters: { $exists: false } },
                    { testParameters: [] }
                ];
            }
            if (keywords && keywords.length > 0) {
                matchQuery.$and = keywords.map(keyword => ({
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { code: { $regex: keyword, $options: 'i' } },
                        { category: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } }
                    ]
                }));
            }
            const tests = await Test_model_1.Test.aggregate([
                { $match: matchQuery },
                { $limit: limit },
                { $sort: { name: 1 } },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        code: 1,
                        category: 1,
                        department: 1,
                        specimen: 1,
                        price: 1,
                        turnaroundTime: 1,
                        description: 1,
                        testParameters: {
                            $map: {
                                input: { $slice: ['$testParameters', 3] },
                                as: 'param',
                                in: {
                                    name: '$$param.name',
                                    unit: '$$param.unit'
                                }
                            }
                        }
                    }
                }
            ]);
            return tests;
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, `Advanced search failed: ${error.message}`);
        }
    }
    async getAvailableTests(filters = {}) {
        try {
            const { category, search, isActive = true, sortBy = 'testName', sortOrder = 'asc' } = filters;
            const query = { isActive };
            if (category) {
                query.category = category.toLowerCase();
            }
            if (search) {
                query.$or = [
                    { testName: { $regex: search, $options: 'i' } },
                    { testCode: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const tests = await Test_model_1.Test.find(query)
                .select('testName testCode category price description specimenType turnaroundTime')
                .sort(sort)
                .limit(100);
            return tests;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to fetch available tests: ' + error.message, 500);
        }
    }
    async getPopularPanels(limit = 10) {
        try {
            const popularPanels = [
                {
                    id: 'basic-metabolic',
                    name: 'Basic Metabolic Panel',
                    description: 'Essential metabolic health indicators',
                    tests: ['Glucose', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'Bicarbonate'],
                    category: 'biochemistry',
                    totalPrice: 120
                },
                {
                    id: 'liver-function',
                    name: 'Liver Function Panel',
                    description: 'Comprehensive liver health assessment',
                    tests: ['ALT', 'AST', 'ALP', 'Bilirubin Total', 'Bilirubin Direct', 'Albumin'],
                    category: 'biochemistry',
                    totalPrice: 150
                },
                {
                    id: 'lipid-panel',
                    name: 'Lipid Panel',
                    description: 'Complete cholesterol and lipid profile',
                    tests: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides', 'VLDL'],
                    category: 'biochemistry',
                    totalPrice: 80
                },
                {
                    id: 'cbc',
                    name: 'Complete Blood Count',
                    description: 'Full blood cell analysis',
                    tests: ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'Platelets', 'MCV', 'MCH', 'MCHC'],
                    category: 'hematology',
                    totalPrice: 60
                },
                {
                    id: 'thyroid-panel',
                    name: 'Thyroid Function Panel',
                    description: 'Thyroid hormone assessment',
                    tests: ['TSH', 'T3', 'T4'],
                    category: 'endocrinology',
                    totalPrice: 100
                }
            ];
            const panelsWithTests = await Promise.all(popularPanels.map(async (panel) => {
                const tests = await Test_model_1.Test.find({
                    testName: { $in: panel.tests },
                    isActive: true
                }).select('_id testName testCode price');
                return {
                    ...panel,
                    tests: tests,
                    actualPrice: tests.reduce((sum, test) => sum + (test.price || 0), 0)
                };
            }));
            return panelsWithTests.slice(0, limit);
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to fetch popular panels: ' + error.message, 500);
        }
    }
    async getTestsByCategory(category) {
        try {
            const tests = await Test_model_1.Test.find({
                category: category.toLowerCase(),
                isActive: true
            })
                .select('testName testCode price description specimenType turnaroundTime')
                .sort({ testName: 1 });
            return tests;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to fetch tests by category: ' + error.message, 500);
        }
    }
    async searchTests(query, limit = 20) {
        try {
            if (!query || query.length < 2) {
                return [];
            }
            const tests = await Test_model_1.Test.find({
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { testName: { $regex: query, $options: 'i' } },
                            { testCode: { $regex: query, $options: 'i' } }
                        ]
                    }
                ]
            })
                .select('testName testCode category price specimenType')
                .limit(limit)
                .sort({ testName: 1 });
            return tests;
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to search tests: ' + error.message, 500);
        }
    }
}
exports.TestService = TestService;
