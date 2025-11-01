import { Response } from 'express';
import { ApiResponse as IApiResponse } from '../types/api.types';

export class ApiResponse {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: any,
    public pagination?: any
  ) {}

  toJSON() {
    return {
      success: true,
      message: this.message,
      ...(this.data !== undefined && { data: this.data }),
      ...(this.pagination && { pagination: this.pagination })
    };
  }

  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    pagination?: any
  ): Response {
    const response: IApiResponse<T> = {
      success: true,
      message,
      ...(data !== undefined && { data }),
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: any[]
  ): Response {
    const response: IApiResponse = {
      success: false,
      message,
      ...(errors && { errors }),
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string = 'Resource created successfully', data?: T): Response {
    return this.success(res, message, data, 201);
  }

  static notFound(res: Response, resource: string = 'Resource'): Response {
    return this.error(res, `${resource} not found`, 404);
  }

  static badRequest(res: Response, message: string = 'Bad request', errors?: any[]): Response {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  static conflict(res: Response, message: string = 'Conflict'): Response {
    return this.error(res, message, 409);
  }

  static serverError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 500);
  }
}