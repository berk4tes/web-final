// statsController — aggregations for dashboard charts and counters
const mongoose = require('mongoose');
const MoodLog = require('../models/MoodLog');
const asyncHandler = require('../utils/asyncHandler');

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

exports.weeklyStats = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const now = new Date();
  const start = startOfDay(now);
  start.setDate(start.getDate() - 6);

  const raw = await MoodLog.aggregate([
    { $match: { userId, loggedAt: { $gte: start } } },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$loggedAt' } },
          moodLabel: '$moodLabel',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, total: 0, byMood: {} });
  }
  const dayMap = Object.fromEntries(days.map((d) => [d.date, d]));

  for (const row of raw) {
    const day = dayMap[row._id.day];
    if (!day) continue;
    day.total += row.count;
    day.byMood[row._id.moodLabel] = (day.byMood[row._id.moodLabel] || 0) + row.count;
  }

  return res.json({ success: true, data: { days } });
});

exports.streak = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const days = await MoodLog.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$loggedAt' } },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const dateSet = new Set(days.map((d) => d._id));

  let streak = 0;
  const cursor = startOfDay(new Date());
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (streak === 0) {
        const yesterday = startOfDay(new Date());
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().slice(0, 10);
        if (dateSet.has(yKey)) {
          streak = 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  return res.json({ success: true, data: { streak } });
});

exports.summary = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const [totalAgg, freqAgg, avgAgg] = await Promise.all([
    MoodLog.countDocuments({ userId }),
    MoodLog.aggregate([
      { $match: { userId } },
      { $group: { _id: '$moodLabel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    MoodLog.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avg: { $avg: '$intensity' } } },
    ]),
  ]);

  return res.json({
    success: true,
    data: {
      totalMoods: totalAgg,
      mostFrequentMood: freqAgg[0]?._id || null,
      mostFrequentMoodCount: freqAgg[0]?.count || 0,
      averageIntensity: avgAgg[0]?.avg ? Number(avgAgg[0].avg.toFixed(2)) : 0,
    },
  });
});
