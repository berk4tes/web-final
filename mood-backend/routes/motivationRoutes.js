// motivationRoutes — XP leaderboard and daily motivation quests
const express = require('express');
const auth = require('../middleware/auth');
const { getSummary, awardTask } = require('../controllers/motivationController');

const router = express.Router();

router.get('/summary', auth, getSummary);
router.post('/award', auth, awardTask);

module.exports = router;
