import { TestZodSchema as BaseTestZodSchema } from './schemas';

export const TestZodSchema = {
  create: BaseTestZodSchema.create,
  update: BaseTestZodSchema.update,
  updatePrice: BaseTestZodSchema.updatePrice,
  addParameter: BaseTestZodSchema.addParameter,
  updateParameter: BaseTestZodSchema.updateParameter,
  priceRange: BaseTestZodSchema.priceRange,
  bulkUpdatePrices: BaseTestZodSchema.bulkUpdatePrices,
  duplicate: BaseTestZodSchema.duplicate
};