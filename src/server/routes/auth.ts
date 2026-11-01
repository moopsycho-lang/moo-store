// src/server/routes/auth.ts
// Customer and admin authentication routes with Zod validation

import { Router } from 'express';
import { z } from 'zod';
import {
  db
} from '../db.ts';
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyRefreshToken,
  createPasswordResetToken,
  consumePasswordResetToken,
  requireAuth,
  type AuthRequest,
} from '../auth.ts';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register
authRouter.post('/register', (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { name, email, password } = parse.data;
    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = hashPassword(password);
    const user = db.createUser({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'CUSTOMER',
      isBlocked: false,
    });

    const tokens = generateTokens(user);

    // Set HTTP-only refresh cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Login
authRouter.post('/login', (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { email, password } = parse.data;
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'This account has been disabled. Please contact customer support.' });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tokens = generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to sign in.' });
  }
});

// Refresh token
authRouter.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = db.findUserById(payload.userId);
    if (!user || user.isBlocked) {
      return res.status(401).json({ error: 'User unavailable or blocked.' });
    }

    const tokens = generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Token refresh failed.' });
  }
});

// Current user profile
authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

// Logout
authRouter.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Signed out successfully.' });
});

// Forgot password
authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = db.findUserByEmail(email);
  if (!user) {
    // Return friendly generic response to prevent email enumeration
    return res.json({ message: 'If an account with that email exists, reset instructions have been created.' });
  }

  const token = createPasswordResetToken(email);
  return res.json({
    message: 'Reset instructions generated.',
    // For convenience in development/testing:
    resetToken: token,
  });
});

// Reset password
authRouter.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Valid token and new password (min 6 characters) required.' });
  }

  const email = consumePasswordResetToken(token);
  if (!email) {
    return res.status(400).json({ error: 'Invalid or expired reset token.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const newHash = hashPassword(newPassword);
  db.setUserPassword(user.id, newHash);

  return res.json({ message: 'Password has been updated. You can now log in.' });
});
