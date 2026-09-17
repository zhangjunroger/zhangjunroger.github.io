import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger.js';
import { config } from './config.js';
import type { ApiResponse, ValidationError } from '../../shared/types.js';

export class AppError extends Error {
  code: number;
  details?: ValidationError[];
  constructor(message: string, code: number = 500, details?: ValidationError[]) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(res: Response, data: T, message: string = 'ok') {
  const body: ApiResponse<T> = {
    success: true,
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
  res.status(200).json(body);
}

export function created<T>(res: Response, data: T, message: string = 'created') {
  res.status(201).json({
    success: true,
    code: 201,
    message,
    data,
    timestamp: Date.now(),
  } as ApiResponse<T>);
}

export function fail(res: Response, message: string, code: number = 400, trace?: string) {
  res.status(code).json({
    success: false,
    code,
    message,
    timestamp: Date.now(),
    trace: config.isDev ? trace : undefined,
  } as ApiResponse);
}

// 全局错误处理中间件
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const details: ValidationError[] = err.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    logger.warn(`[400] validation: ${JSON.stringify(details)}`);
    return res.status(400).json({
      success: false,
      code: 400,
      message: '请求参数有误',
      details,
      timestamp: Date.now(),
    } satisfies ApiResponse);
  }
  if (err instanceof AppError) {
    logger.warn(`[${err.code}] ${err.message}`);
    return res.status(err.code).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details,
      timestamp: Date.now(),
    } satisfies ApiResponse);
  }
  logger.error('Unhandled error', {
    message: err?.message,
    stack: err?.stack,
  });
  res.status(500).json({
    success: false,
    code: 500,
    message: config.isDev ? (err?.message || '服务器错误') : '服务器内部错误',
    timestamp: Date.now(),
    trace: config.isDev ? err?.stack : undefined,
  } satisfies ApiResponse);
}

// 404处理
export function notFound(req: Request, res: Response) {
  fail(res, `接口不存在: ${req.method} ${req.originalUrl}`, 404);
}

// 异步路由包装,免写try-catch
export function wrap(fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
