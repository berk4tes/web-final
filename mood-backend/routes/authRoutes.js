// authRoutes — register, login, current user
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, getMe } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 1 }).withMessage('Password required'),
  ],
  login
);

router.get('/me', auth, getMe);

module.exports = router;
