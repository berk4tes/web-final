// motivationRoutes — XP leaderboard and daily motivation quests
const express = require('express');
const auth = require('../middleware/auth');
const { getSummary, awardTask, saveSpringReview } = require('../controllers/motivationController');

const router = express.Router();

router.get('/summary', auth, getSummary);
router.post('/award', auth, awardTask);
router.post('/spring-review', auth, saveSpringReview);

module.exports = router;
