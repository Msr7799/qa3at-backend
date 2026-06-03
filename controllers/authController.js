import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// ── Helper: sign JWT ──────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Strip sensitive fields
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.__v;

  res.status(statusCode).json({
    success: true,
    data: {
      user: {
        id: userObj._id,
        email: userObj.email,
        name: userObj.name,
        phone: userObj.phone,
        role: userObj.role,
      },
      accessToken: token,
    },
  });
};

// ── POST /api/auth/register ───────────────────────────────────────────────

export const register = catchAsync(async (req, res, next) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return next(new AppError('email, password and name are required.', 400));
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({ email, password, name, phone });

  sendAuthResponse(user, 201, res);
});

// ── POST /api/auth/login ──────────────────────────────────────────────────

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('email and password are required.', 400));
  }

  // Explicitly include password (select: false in schema)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  sendAuthResponse(user, 200, res);
});

// ── POST /api/auth/google-login ──────────────────────────────────────────

export const googleLogin = catchAsync(async (req, res, next) => {
  const { email, name, phone } = req.body;

  if (!email || !name) {
    return next(new AppError('email and name are required.', 400));
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(16).toString('hex');
    user = await User.create({
      email,
      password: randomPassword,
      name,
      phone: phone || null,
    });
  } else {
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 403));
    }
    if (phone && !user.phone) {
      user.phone = phone;
      await user.save();
    }
  }

  sendAuthResponse(user, 200, res);
});

// ── GET /api/auth/profile (protected) ────────────────────────────────────

export const getProfile = catchAsync(async (req, res) => {
  const user = req.user; // attached by protect middleware

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});
