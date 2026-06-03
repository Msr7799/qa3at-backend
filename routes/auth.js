import express from 'express';
const router = express.Router();
import { register, login, googleLogin, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google-login
router.post('/google-login', googleLogin);

// GET  /api/auth/profile  (protected)
router.get('/profile', protect, getProfile);

export default router;
