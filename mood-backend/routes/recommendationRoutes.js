// recommendationRoutes — generate, list, fetch single
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { recommendationLimiter } = require('../middleware/rateLimiter');
const {
  generateRecommendations,
  getHistory,
  getById,
} = require('../controllers/recommendationController');

const MOOD_LABELS = ['happy', 'sad', 'excited', 'calm', 'angry', 'nostalgic', 'tired'];
const CONTENT_TYPES = ['movie', 'series', 'music'];

const router = express.Router();

router.post(
  '/mood',
  auth,
  recommendationLimiter,
  [
    body('moodLabel').isIn(MOOD_LABELS).withMessage('Invalid mood label'),
    body('intensity').isInt({ min: 1, max: 10 }).withMessage('Intensity must be 1-10'),
    body('contentType').isIn(CONTENT_TYPES).withMessage('Invalid content type'),
    body('moodText').optional().isString().isLength({ max: 500 }),
  ],
  generateRecommendations
);

router.get('/history', auth, getHistory);
router.get('/:id', auth, getById);

module.exports = router;
