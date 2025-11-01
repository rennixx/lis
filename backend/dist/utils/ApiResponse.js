"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(statusCode, message, data, pagination) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.pagination = pagination;
    }
    toJSON() {
        return {
            success: true,
            message: this.message,
            ...(this.data !== undefined && { data: this.data }),
            ...(this.pagination && { pagination: this.pagination })
        };
    }
    static success(res, message, data, statusCode = 200, pagination) {
        const response = {
            success: true,
            message,
            ...(data !== undefined && { data }),
        };
        if (pagination) {
            response.pagination = pagination;
        }
        return res.status(statusCode).json(response);
    }
    static error(res, message, statusCode = 500, errors) {
        const response = {
            success: false,
            message,
            ...(errors && { errors }),
        };
        return res.status(statusCode).json(response);
    }
    static created(res, message = 'Resource created successfully', data) {
        return this.success(res, message, data, 201);
    }
    static notFound(res, resource = 'Resource') {
        return this.error(res, `${resource} not found`, 404);
    }
    static badRequest(res, message = 'Bad request', errors) {
        return this.error(res, message, 400, errors);
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }
    static conflict(res, message = 'Conflict') {
        return this.error(res, message, 409);
    }
    static serverError(res, message = 'Internal server error') {
        return this.error(res, message, 500);
    }
}
exports.ApiResponse = ApiResponse;
