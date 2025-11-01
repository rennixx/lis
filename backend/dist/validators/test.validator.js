"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestZodSchema = void 0;
const schemas_1 = require("./schemas");
exports.TestZodSchema = {
    create: schemas_1.TestZodSchema.create,
    update: schemas_1.TestZodSchema.update,
    updatePrice: schemas_1.TestZodSchema.updatePrice,
    addParameter: schemas_1.TestZodSchema.addParameter,
    updateParameter: schemas_1.TestZodSchema.updateParameter,
    priceRange: schemas_1.TestZodSchema.priceRange,
    bulkUpdatePrices: schemas_1.TestZodSchema.bulkUpdatePrices,
    duplicate: schemas_1.TestZodSchema.duplicate
};
