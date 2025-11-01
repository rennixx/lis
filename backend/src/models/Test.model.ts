// @ts-ignore
import Test from '../schemas/test.schema';
import { ITest } from '../types/models.types';

export class TestModel {
  // Basic CRUD operations
  static async create(testData: Partial<ITest>): Promise<ITest> {
    return await Test.create(testData);
  }

  static async findById(id: string): Promise<ITest | null> {
    return await Test.findById(id);
  }

  static async findByCode(code: string): Promise<ITest | null> {
    return await Test.findOne({ code: code.toUpperCase(), isActive: true });
  }

  static async findAll(filters: any = {}, options: any = {}): Promise<ITest[]> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      search,
      category,
      ...queryFilters
    } = filters;

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let query: any = { isActive: true, ...queryFilters };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    return await Test.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  static async updateById(id: string, updateData: Partial<ITest>): Promise<ITest | null> {
    return await Test.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  static async deleteById(id: string): Promise<ITest | null> {
    return await Test.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  static async countDocuments(filters: any = {}): Promise<number> {
    let query: any = { isActive: true, ...filters };

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } }
      ];
      delete query.search;
    }

    return await Test.countDocuments(query);
  }

  // Specific methods for test operations
  static async searchTests(searchTerm: string, limit: number = 10): Promise<ITest[]> {
    const query = {
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await Test.find(query)
      .limit(limit)
      .sort({ name: 1 });
  }

  static async getTestsByCategory(category: string): Promise<ITest[]> {
    return await Test.find({ category, isActive: true })
      .sort({ name: 1 });
  }

  static async getAllCategories(): Promise<string[]> {
    const categories = await Test.distinct('category', { isActive: true });
    return categories.filter(Boolean).sort();
  }

  static async updateTestPrice(testId: string, newPrice: number): Promise<ITest | null> {
    return await Test.findByIdAndUpdate(
      testId,
      {
        price: newPrice,
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async getPopularTests(limit: number = 10): Promise<any[]> {
    return await Test.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'tests',
          as: 'orders'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          code: 1,
          category: 1,
          price: 1,
          orderCount: 1
        }
      }
    ]);
  }

  static async getTestStatistics(): Promise<any> {
    const statistics = await Test.aggregate([
      { $match: { isActive: true } },
      {
        $facet: {
          totalTests: [{ $count: "count" }],
          categoryDistribution: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
                avgPrice: { $avg: "$price" }
              }
            }
          ],
          priceDistribution: [
            {
              $bucket: {
                groupBy: "$price",
                boundaries: [0, 50, 100, 200, 500, 1000],
                default: "expensive",
                output: {
                  count: { $sum: 1 }
                }
              }
            }
          ],
          averagePrice: [
            {
              $group: {
                _id: null,
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
              }
            }
          ]
        }
      }
    ]);

    return statistics[0];
  }

  static async addTestParameter(testId: string, parameter: any): Promise<ITest | null> {
    return await Test.findByIdAndUpdate(
      testId,
      {
        $push: { testParameters: parameter },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async updateTestParameter(testId: string, paramIndex: number, parameter: any): Promise<ITest | null> {
    const updatePath = `testParameters.${paramIndex}`;
    return await Test.findByIdAndUpdate(
      testId,
      {
        $set: { [updatePath]: parameter },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async removeTestParameter(testId: string, paramIndex: number): Promise<ITest | null> {
    return await Test.findByIdAndUpdate(
      testId,
      {
        $unset: { [`testParameters.${paramIndex}`]: 1 },
        $pull: { testParameters: null },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async getTestsWithTurnaroundTime(): Promise<ITest[]> {
    return await Test.find({
      isActive: true,
      turnaroundTime: { $exists: true, $gt: 0 }
    })
    .sort({ turnaroundTime: 1 });
  }

  static async getTestsByDepartment(department: string): Promise<ITest[]> {
    return await Test.find({
      department: department,
      isActive: true
    })
    .sort({ name: 1 });
  }

  static async getAllDepartments(): Promise<string[]> {
    const departments = await Test.distinct('department', { isActive: true }) as string[];
    return departments.filter(Boolean).sort();
  }

  static async updateTestNormalRange(testId: string, normalRange: any): Promise<ITest | null> {
    return await Test.findByIdAndUpdate(
      testId,
      {
        normalRange,
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async getTestsWithPriceRange(minPrice: number, maxPrice: number): Promise<ITest[]> {
    return await Test.find({
      isActive: true,
      price: { $gte: minPrice, $lte: maxPrice }
    })
    .sort({ price: 1 });
  }

  static async searchBySpecimenType(specimenType: string): Promise<ITest[]> {
    return await Test.find({
      isActive: true,
      specimen: specimenType
    })
    .sort({ name: 1 });
  }

  static async getAllSpecimenTypes(): Promise<string[]> {
    const specimenTypes = await Test.distinct('specimen', { isActive: true }) as string[];
    return specimenTypes.filter(Boolean).sort();
  }

  static async bulkUpdatePrices(updates: Array<{ testId: string; newPrice: number }>): Promise<any> {
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.testId },
        update: {
          $set: {
            price: update.newPrice,
            updatedAt: new Date()
          }
        }
      }
    }));

    return await Test.bulkWrite(bulkOps);
  }

  static async getTestWithParameters(testId: string): Promise<ITest | null> {
    return await Test.findById(testId);
  }

  static async duplicateTest(testId: string, newName: string, newCode: string): Promise<ITest | null> {
    const originalTest = await Test.findById(testId);
    if (!originalTest) return null;

    const testObj = originalTest.toObject();
    delete testObj._id;
    delete testObj.createdAt;
    delete testObj.updatedAt;

    testObj.name = newName;
    testObj.code = newCode.toUpperCase();

    return await Test.create(testObj);
  }
}

// Export the raw Test schema and ITest type for direct use
export { Test, ITest };