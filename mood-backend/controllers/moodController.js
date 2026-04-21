// moodController — create mood logs and read user history
const { validationResult } = require('express-validator');
const MoodLog = require('../models/MoodLog');
const asyncHandler = require('../utils/asyncHandler');

exports.createMood = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { moodLabel, moodText = '', intensity } = req.body;
  const mood = await MoodLog.create({
    userId: req.user._id,
    moodLabel,
    moodText,
    intensity,
  });

  return res.status(201).json({ success: true, data: { mood } });
});

exports.getMoodHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  const [items, total] = await Promise.all([
    MoodLog.find(filter).sort({ loggedAt: -1 }).skip(skip).limit(limit),
    MoodLog.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});
