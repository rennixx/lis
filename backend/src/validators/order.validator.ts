import { OrderZodSchema as BaseOrderZodSchema } from './schemas';

export const OrderZodSchema = {
  create: BaseOrderZodSchema.create,
  update: BaseOrderZodSchema.update,
  updateStatus: BaseOrderZodSchema.updateStatus,
  cancel: BaseOrderZodSchema.cancel,
  addTest: BaseOrderZodSchema.addTest,
  updatePayment: BaseOrderZodSchema.updatePayment
};