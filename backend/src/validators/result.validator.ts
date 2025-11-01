import { ResultZodSchema as BaseResultZodSchema } from './schemas';

export const ResultZodSchema = {
  create: BaseResultZodSchema.create,
  update: BaseResultZodSchema.update,
  addParameter: BaseResultZodSchema.addParameter,
  approve: BaseResultZodSchema.approve,
  reject: BaseResultZodSchema.reject
};