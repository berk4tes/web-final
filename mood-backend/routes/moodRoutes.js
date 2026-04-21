// moodRoutes — log moods and read history
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { createMood, getMoodHistory } = require('../controllers/moodController');

const MOOD_LABELS = ['happy', 'sad', 'excited', 'calm', 'angry', 'nostalgic', 'tired'];

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('moodLabel').isIn(MOOD_LABELS).withMessage('Invalid mood label'),
    body('intensity').isInt({ min: 1, max: 10 }).withMessage('Intensity must be 1-10'),
    body('moodText').optional().isString().isLength({ max: 500 }),
  ],
  createMood
);

router.get('/history', auth, getMoodHistory);

module.exports = router;
