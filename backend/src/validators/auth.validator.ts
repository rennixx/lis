import { AuthZodSchema as BaseAuthZodSchema } from './schemas';

export const AuthZodSchema = {
  register: BaseAuthZodSchema.register,
  login: BaseAuthZodSchema.login,
  updateProfile: BaseAuthZodSchema.updateProfile,
  changePassword: BaseAuthZodSchema.changePassword,
  forgotPassword: BaseAuthZodSchema.forgotPassword,
  resetPassword: BaseAuthZodSchema.resetPassword,
  updateUserStatus: BaseAuthZodSchema.updateUserStatus,
  updateUserRole: BaseAuthZodSchema.updateUserRole,
  refresh: BaseAuthZodSchema.refresh
};