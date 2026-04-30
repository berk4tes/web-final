// recommendationRoutes — generate, list, fetch single
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { recommendationLimiter } = require('../middleware/rateLimiter');
const {
  generateRecommendations,
  generateVibe,
  getTmdbDetails,
  getHistory,
  getById,
} = require('../controllers/recommendationController');

const MOOD_LABELS = ['happy', 'sad', 'excited', 'calm', 'angry', 'nostalgic', 'tired'];
const CONTENT_TYPES = ['movie', 'series', 'music', 'book'];

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

router.post(
  '/vibe',
  auth,
  recommendationLimiter,
  [
    body('prompt')
      .isString()
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Prompt must be 3-500 characters'),
  ],
  generateVibe
);

router.get('/history', auth, getHistory);
router.get('/tmdb/details', auth, getTmdbDetails);
router.get('/:id', auth, getById);

module.exports = router;
