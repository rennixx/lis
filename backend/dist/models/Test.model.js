"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = exports.TestModel = void 0;
const test_schema_1 = __importDefault(require("../schemas/test.schema"));
exports.Test = test_schema_1.default;
class TestModel {
    static async create(testData) {
        return await test_schema_1.default.create(testData);
    }
    static async findById(id) {
        return await test_schema_1.default.findById(id);
    }
    static async findByCode(code) {
        return await test_schema_1.default.findOne({ code: code.toUpperCase(), isActive: true });
    }
    static async findAll(filters = {}, options = {}) {
        const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', search, category, ...queryFilters } = filters;
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        let query = { isActive: true, ...queryFilters };
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
        return await test_schema_1.default.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }
    static async updateById(id, updateData) {
        return await test_schema_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
    static async deleteById(id) {
        return await test_schema_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
    static async countDocuments(filters = {}) {
        let query = { isActive: true, ...filters };
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } },
                { category: { $regex: filters.search, $options: 'i' } }
            ];
            delete query.search;
        }
        return await test_schema_1.default.countDocuments(query);
    }
    static async searchTests(searchTerm, limit = 10) {
        const query = {
            isActive: true,
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { code: { $regex: searchTerm, $options: 'i' } },
                { category: { $regex: searchTerm, $options: 'i' } }
            ]
        };
        return await test_schema_1.default.find(query)
            .limit(limit)
            .sort({ name: 1 });
    }
    static async getTestsByCategory(category) {
        return await test_schema_1.default.find({ category, isActive: true })
            .sort({ name: 1 });
    }
    static async getAllCategories() {
        const categories = await test_schema_1.default.distinct('category', { isActive: true });
        return categories.filter(Boolean).sort();
    }
    static async updateTestPrice(testId, newPrice) {
        return await test_schema_1.default.findByIdAndUpdate(testId, {
            price: newPrice,
            updatedAt: new Date()
        }, { new: true });
    }
    static async getPopularTests(limit = 10) {
        return await test_schema_1.default.aggregate([
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
    static async getTestStatistics() {
        const statistics = await test_schema_1.default.aggregate([
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
    static async addTestParameter(testId, parameter) {
        return await test_schema_1.default.findByIdAndUpdate(testId, {
            $push: { testParameters: parameter },
            updatedAt: new Date()
        }, { new: true });
    }
    static async updateTestParameter(testId, paramIndex, parameter) {
        const updatePath = `testParameters.${paramIndex}`;
        return await test_schema_1.default.findByIdAndUpdate(testId, {
            $set: { [updatePath]: parameter },
            updatedAt: new Date()
        }, { new: true });
    }
    static async removeTestParameter(testId, paramIndex) {
        return await test_schema_1.default.findByIdAndUpdate(testId, {
            $unset: { [`testParameters.${paramIndex}`]: 1 },
            $pull: { testParameters: null },
            updatedAt: new Date()
        }, { new: true });
    }
    static async getTestsWithTurnaroundTime() {
        return await test_schema_1.default.find({
            isActive: true,
            turnaroundTime: { $exists: true, $gt: 0 }
        })
            .sort({ turnaroundTime: 1 });
    }
    static async getTestsByDepartment(department) {
        return await test_schema_1.default.find({
            department: department,
            isActive: true
        })
            .sort({ name: 1 });
    }
    static async getAllDepartments() {
        const departments = await test_schema_1.default.distinct('department', { isActive: true });
        return departments.filter(Boolean).sort();
    }
    static async updateTestNormalRange(testId, normalRange) {
        return await test_schema_1.default.findByIdAndUpdate(testId, {
            normalRange,
            updatedAt: new Date()
        }, { new: true });
    }
    static async getTestsWithPriceRange(minPrice, maxPrice) {
        return await test_schema_1.default.find({
            isActive: true,
            price: { $gte: minPrice, $lte: maxPrice }
        })
            .sort({ price: 1 });
    }
    static async searchBySpecimenType(specimenType) {
        return await test_schema_1.default.find({
            isActive: true,
            specimen: specimenType
        })
            .sort({ name: 1 });
    }
    static async getAllSpecimenTypes() {
        const specimenTypes = await test_schema_1.default.distinct('specimen', { isActive: true });
        return specimenTypes.filter(Boolean).sort();
    }
    static async bulkUpdatePrices(updates) {
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
        return await test_schema_1.default.bulkWrite(bulkOps);
    }
    static async getTestWithParameters(testId) {
        return await test_schema_1.default.findById(testId);
    }
    static async duplicateTest(testId, newName, newCode) {
        const originalTest = await test_schema_1.default.findById(testId);
        if (!originalTest)
            return null;
        const testObj = originalTest.toObject();
        delete testObj._id;
        delete testObj.createdAt;
        delete testObj.updatedAt;
        testObj.name = newName;
        testObj.code = newCode.toUpperCase();
        return await test_schema_1.default.create(testObj);
    }
}
exports.TestModel = TestModel;
