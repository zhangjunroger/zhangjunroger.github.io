import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { db } from './db.js';
import { AppError } from './error.js';
import type { SafeUser } from '../../shared/types.js';

export function hashPassword(pwd: string) {
  return bcrypt.hashSync(pwd, config.auth.bcryptRounds);
}

export function verifyPassword(pwd: string, hash: string) {
  return bcrypt.compareSync(pwd, hash);
}

export function signToken(payload: { sub: string; role: string }) {
  const seconds = parseDurationSec(config.auth.jwtExpiresIn);
  return jwt.sign(
    { ...payload, iat: Math.floor(Date.now() / 1000) },
    config.auth.jwtSecret,
    { expiresIn: seconds }
  );
}

export function parseDurationSec(d: string): number {
  const match = /^(\d+)([smhdwy])?$/.exec(String(d));
  if (!match) return 7 * 86400;
  const n = parseInt(match[1], 10);
  const unit = match[2] || 'd';
  const m: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31536000 };
  return n * (m[unit] || 86400);
}

export interface AuthContext {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      currentUser?: SafeUser;
    }
  }
}

// 需要登录
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) throw new AppError('请先登录', 401);
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
    req.auth = { userId: decoded.sub, role: decoded.role || 'student' };
    const user = db.find('users', (u) => u.id === req.auth!.userId);
    if (!user || !user.isActive) throw new AppError('用户不存在或已被停用', 401);
    const { passwordHash, ...safe } = user;
    req.currentUser = safe as SafeUser;
    next();
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    throw new AppError('登录已过期,请重新登录', 401);
  }
}

// 可选登录:没token也允许访问,req.auth可能为undefined
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
    req.auth = { userId: decoded.sub, role: decoded.role || 'student' };
    const user = db.find('users', (u) => u.id === req.auth!.userId);
    if (user) {
      const { passwordHash, ...safe } = user;
      req.currentUser = safe as SafeUser;
    }
  } catch {/* noop */}
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError('请先登录', 401);
    if (!roles.includes(req.auth.role)) throw new AppError('权限不足', 403);
    next();
  };
}
