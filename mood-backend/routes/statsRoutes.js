// statsRoutes — dashboard analytics endpoints
const express = require('express');
const auth = require('../middleware/auth');
const { weeklyStats, streak, summary } = require('../controllers/statsController');

const router = express.Router();

router.get('/weekly', auth, weeklyStats);
router.get('/streak', auth, streak);
router.get('/summary', auth, summary);

module.exports = router;
