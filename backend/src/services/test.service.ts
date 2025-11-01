// @ts-nocheck
import { Test, ITest } from '../models/Test.model';
import { IDGenerator } from '../utils/generateID';
import { startSession } from 'mongoose';
import { ApiError } from '../utils/ApiError';

export class TestService {
  // Create Test with auto-generated code
  async createTest(data: Partial<ITest>, session?: any) {
    try {
      let testCode = data.code;

      if (!testCode) {
        testCode = await IDGenerator.generateTestCode();
      }

      const testData = {
        ...data,
        code: testCode.toUpperCase(),
        isActive: true
      };

      const test = session
        ? await Test.create([testData], { session })
        : await Test.create(testData);

      return Array.isArray(test) ? test[0] : test;
    } catch (error) {
      throw new ApiError(500, `Failed to create test: ${error.message}`);
    }
  }

  // Get all tests with filtering and pagination
  async getAllTests(filters: any) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        department,
        specimen,
        minPrice,
        maxPrice,
        isActive,
        sortBy = 'name',
        sortOrder = 'asc'
      } = filters;

      const queryFilters: any = {};

      if (category) queryFilters.category = category;
      if (department) queryFilters.department = department;
      if (specimen) queryFilters.specimen = specimen;
      if (typeof isActive === 'boolean') queryFilters.isActive = isActive;

      if (minPrice !== undefined || maxPrice !== undefined) {
        queryFilters.price = {};
        if (minPrice !== undefined) queryFilters.price.$gte = minPrice;
        if (maxPrice !== undefined) queryFilters.price.$lte = maxPrice;
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
        Test.findAll(paginationFilters),
        Test.countDocuments(queryFilters)
      ]);

      return {
        tests,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      };
    } catch (error) {
      throw new ApiError(500, `Failed to fetch tests: ${error.message}`);
    }
  }

  // Get test by ID
  async getTestById(id: string) {
    try {
      const test = await Test.findById(id);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to fetch test: ${error.message}`);
    }
  }

  // Get test by code
  async getTestByCode(code: string) {
    try {
      const test = await Test.findByCode(code);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to fetch test: ${error.message}`);
    }
  }

  // Update test with transaction support
  async updateTest(id: string, data: Partial<ITest>, session?: any) {
    try {
      const test = session
        ? await Test.updateById(id, { ...data, updatedAt: new Date() })
        : await Test.updateById(id, { ...data, updatedAt: new Date() });

      if (!test) {
        throw new ApiError(404, 'Test not found');
      }

      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update test: ${error.message}`);
    }
  }

  // Soft delete test with transaction support
  async deleteTest(id: string, session?: any) {
    try {
      const test = session
        ? await Test.deleteById(id)
        : await Test.deleteById(id);

      if (!test) {
        throw new ApiError(404, 'Test not found');
      }

      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to delete test: ${error.message}`);
    }
  }

  // Search tests
  async searchTests(query: string, limit: number = 10) {
    try {
      return await Test.searchTests(query, limit);
    } catch (error) {
      throw new ApiError(500, `Failed to search tests: ${error.message}`);
    }
  }

  // Get tests by category
  async getTestsByCategory(category: string) {
    try {
      return await Test.getTestsByCategory(category);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch tests by category: ${error.message}`);
    }
  }

  // Get all categories
  async getAllCategories() {
    try {
      return await Test.getAllCategories();
    } catch (error) {
      throw new ApiError(500, `Failed to fetch categories: ${error.message}`);
    }
  }

  // Get test statistics with aggregation
  async getTestStatistics() {
    try {
      return await Test.getTestStatistics();
    } catch (error) {
      throw new ApiError(500, `Failed to fetch test statistics: ${error.message}`);
    }
  }

  // Get popular tests
  async getPopularTests(limit: number = 10) {
    try {
      return await Test.getPopularTests(limit);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch popular tests: ${error.message}`);
    }
  }

  // Update test price
  async updateTestPrice(id: string, price: number) {
    try {
      const test = await Test.updateTestPrice(id, price);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update test price: ${error.message}`);
    }
  }

  // Add test parameter
  async addTestParameter(id: string, parameter: any) {
    try {
      const test = await Test.addTestParameter(id, parameter);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to add test parameter: ${error.message}`);
    }
  }

  // Update test parameter
  async updateTestParameter(id: string, paramIndex: number, parameter: any) {
    try {
      const test = await Test.updateTestParameter(id, paramIndex, parameter);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update test parameter: ${error.message}`);
    }
  }

  // Remove test parameter
  async removeTestParameter(id: string, paramIndex: number) {
    try {
      const test = await Test.removeTestParameter(id, paramIndex);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to remove test parameter: ${error.message}`);
    }
  }

  // Get test with parameters
  async getTestWithParameters(id: string) {
    try {
      const test = await Test.getTestWithParameters(id);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to fetch test with parameters: ${error.message}`);
    }
  }

  // Get tests by department
  async getTestsByDepartment(department: string) {
    try {
      return await Test.getTestsByDepartment(department);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch tests by department: ${error.message}`);
    }
  }

  // Get all departments
  async getAllDepartments() {
    try {
      return await Test.getAllDepartments();
    } catch (error) {
      throw new ApiError(500, `Failed to fetch departments: ${error.message}`);
    }
  }

  // Update test normal range
  async updateTestNormalRange(id: string, range: any) {
    try {
      const test = await Test.updateTestNormalRange(id, range);
      if (!test) {
        throw new ApiError(404, 'Test not found');
      }
      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update test normal range: ${error.message}`);
    }
  }

  // Get tests by price range
  async getTestsByPriceRange(min: number, max: number) {
    try {
      return await Test.getTestsWithPriceRange(min, max);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch tests by price range: ${error.message}`);
    }
  }

  // Search by specimen type
  async searchBySpecimenType(specimen: string) {
    try {
      return await Test.searchBySpecimenType(specimen);
    } catch (error) {
      throw new ApiError(500, `Failed to search tests by specimen: ${error.message}`);
    }
  }

  // Get all specimen types
  async getAllSpecimenTypes() {
    try {
      return await Test.getAllSpecimenTypes();
    } catch (error) {
      throw new ApiError(500, `Failed to fetch specimen types: ${error.message}`);
    }
  }

  // Bulk update prices with transaction support
  async bulkUpdatePrices(updates: Array<{ testId: string; newPrice: number }>) {
    const session = await startSession();
    session.startTransaction();

    try {
      const result = await Test.bulkUpdatePrices(updates);

      await session.commitTransaction();
      session.endSession();

      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(500, `Bulk price update failed: ${error.message}`);
    }
  }

  // Duplicate test
  async duplicateTest(id: string, newName: string, newCode?: string) {
    try {
      if (!newCode) {
        newCode = await IDGenerator.generateTestCode();
      }

      const test = await Test.duplicateTest(id, newName, newCode);
      if (!test) {
        throw new ApiError(404, 'Original test not found');
      }

      return test;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to duplicate test: ${error.message}`);
    }
  }

  // Advanced search with multiple criteria
  async advancedSearch(criteria: any) {
    try {
      const {
        categories,
        departments,
        specimenTypes,
        priceRange,
        turnaroundTime,
        hasParameters,
        keywords,
        limit = 20
      } = criteria;

      const matchQuery: any = { isActive: true };

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
        if (priceRange.min !== undefined) matchQuery.price.$gte = priceRange.min;
        if (priceRange.max !== undefined) matchQuery.price.$lte = priceRange.max;
      }

      if (turnaroundTime) {
        matchQuery.turnaroundTime = {};
        if (turnaroundTime.min !== undefined) matchQuery.turnaroundTime.$gte = turnaroundTime.min;
        if (turnaroundTime.max !== undefined) matchQuery.turnaroundTime.$lte = turnaroundTime.max;
      }

      if (hasParameters === true) {
        matchQuery.testParameters = { $exists: true, $ne: [] };
      } else if (hasParameters === false) {
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

      const tests = await Test.aggregate([
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
    } catch (error) {
      throw new ApiError(500, `Advanced search failed: ${error.message}`);
    }
  }

  // Get available tests for order creation
  async getAvailableTests(filters: {
    category?: string;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    try {
      const {
        category,
        search,
        isActive = true,
        sortBy = 'testName',
        sortOrder = 'asc'
      } = filters;

      const query: any = { isActive };

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

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const tests = await Test.find(query)
        .select('testName testCode category price description specimenType turnaroundTime')
        .sort(sort)
        .limit(100);

      return tests;
    } catch (error) {
      throw new ApiError('Failed to fetch available tests: ' + error.message, 500);
    }
  }

  // Get popular test panels
  async getPopularPanels(limit: number = 10) {
    try {
      // Define popular test panels based on common combinations
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

      // Get actual test data for panels
      const panelsWithTests = await Promise.all(
        popularPanels.map(async (panel) => {
          const tests = await Test.find({
            testName: { $in: panel.tests },
            isActive: true
          }).select('_id testName testCode price');

          return {
            ...panel,
            tests: tests,
            actualPrice: tests.reduce((sum, test) => sum + (test.price || 0), 0)
          };
        })
      );

      return panelsWithTests.slice(0, limit);
    } catch (error) {
      throw new ApiError('Failed to fetch popular panels: ' + error.message, 500);
    }
  }

  // Get tests by category
  async getTestsByCategory(category: string) {
    try {
      const tests = await Test.find({
        category: category.toLowerCase(),
        isActive: true
      })
      .select('testName testCode price description specimenType turnaroundTime')
      .sort({ testName: 1 });

      return tests;
    } catch (error) {
      throw new ApiError('Failed to fetch tests by category: ' + error.message, 500);
    }
  }

  // Search tests with autocomplete
  async searchTests(query: string, limit: number = 20) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const tests = await Test.find({
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
    } catch (error) {
      throw new ApiError('Failed to search tests: ' + error.message, 500);
    }
  }
}