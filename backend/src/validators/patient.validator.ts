import { z } from 'zod';
import { PatientZodSchema as BasePatientZodSchema } from './schemas';

export const PatientZodSchema = {
  create: BasePatientZodSchema.create,
  update: BasePatientZodSchema.update,
  addMedicalCondition: BasePatientZodSchema.addMedicalCondition,
  removeMedicalCondition: BasePatientZodSchema.removeMedicalCondition,
  addMedication: BasePatientZodSchema.addMedication,
  removeMedication: BasePatientZodSchema.removeMedication,
  addAllergy: BasePatientZodSchema.addAllergy,
  removeAllergy: BasePatientZodSchema.removeAllergy
};