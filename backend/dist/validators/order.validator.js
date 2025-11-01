"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderZodSchema = void 0;
const schemas_1 = require("./schemas");
exports.OrderZodSchema = {
    create: schemas_1.OrderZodSchema.create,
    update: schemas_1.OrderZodSchema.update,
    updateStatus: schemas_1.OrderZodSchema.updateStatus,
    cancel: schemas_1.OrderZodSchema.cancel,
    addTest: schemas_1.OrderZodSchema.addTest,
    updatePayment: schemas_1.OrderZodSchema.updatePayment
};
