"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultZodSchema = void 0;
const schemas_1 = require("./schemas");
exports.ResultZodSchema = {
    create: schemas_1.ResultZodSchema.create,
    update: schemas_1.ResultZodSchema.update,
    addParameter: schemas_1.ResultZodSchema.addParameter,
    approve: schemas_1.ResultZodSchema.approve,
    reject: schemas_1.ResultZodSchema.reject
};
