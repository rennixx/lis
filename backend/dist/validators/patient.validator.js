"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientZodSchema = void 0;
const schemas_1 = require("./schemas");
exports.PatientZodSchema = {
    create: schemas_1.PatientZodSchema.create,
    update: schemas_1.PatientZodSchema.update,
    addMedicalCondition: schemas_1.PatientZodSchema.addMedicalCondition,
    removeMedicalCondition: schemas_1.PatientZodSchema.removeMedicalCondition,
    addMedication: schemas_1.PatientZodSchema.addMedication,
    removeMedication: schemas_1.PatientZodSchema.removeMedication,
    addAllergy: schemas_1.PatientZodSchema.addAllergy,
    removeAllergy: schemas_1.PatientZodSchema.removeAllergy
};
