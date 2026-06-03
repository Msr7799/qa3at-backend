const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/google-login
router.post('/google-login', authController.googleLogin);

// GET  /api/auth/profile  (protected)
router.get('/profile', protect, authController.getProfile);

module.exports = router;
