const express = require('express');
const { generateMoodboard } = require('../controllers/moodboardController');
const auth = require('../middleware/auth');
const { recommendationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/generate', auth, recommendationLimiter, generateMoodboard);

module.exports = router;
