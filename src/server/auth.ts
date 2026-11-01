// src/server/auth.ts
// JWT authentication, password hashing, and role-based access control middleware

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import type { User, Role } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'moo-super-secure-jwt-secret-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'moo-super-secure-refresh-secret-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: User;
}

export function hashPassword(plain: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function generateTokens(user: User) {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Memory store for password reset tokens
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

export function createPasswordResetToken(email: string): string {
  const token = `rst-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  resetTokens.set(token, {
    email: email.toLowerCase(),
    expiresAt: Date.now() + 1000 * 60 * 30, // 30 minutes
  });
  return token;
}

export function consumePasswordResetToken(token: string): string | null {
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  resetTokens.delete(token);
  return entry.email;
}

// Middleware: Require valid JWT token
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Token is invalid or expired.' });
  }

  const user = db.findUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists.' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }

  req.user = user;
  next();
}

// Middleware: Optional JWT auth (for guest or logged in user)
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (payload) {
      const user = db.findUserById(payload.userId);
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  }
  next();
}

// Middleware: Require ADMIN role
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin privilege required.' });
    }
    next();
  });
}
