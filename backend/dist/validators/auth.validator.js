"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthZodSchema = void 0;
const schemas_1 = require("./schemas");
exports.AuthZodSchema = {
    register: schemas_1.AuthZodSchema.register,
    login: schemas_1.AuthZodSchema.login,
    updateProfile: schemas_1.AuthZodSchema.updateProfile,
    changePassword: schemas_1.AuthZodSchema.changePassword,
    forgotPassword: schemas_1.AuthZodSchema.forgotPassword,
    resetPassword: schemas_1.AuthZodSchema.resetPassword,
    updateUserStatus: schemas_1.AuthZodSchema.updateUserStatus,
    updateUserRole: schemas_1.AuthZodSchema.updateUserRole,
    refresh: schemas_1.AuthZodSchema.refresh
};
