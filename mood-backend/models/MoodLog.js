// MoodLog — captures a single mood entry from a user
const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    moodLabel: {
      type: String,
      enum: ['happy', 'sad', 'excited', 'calm', 'angry', 'nostalgic', 'tired'],
      required: true,
    },
    moodText: {
      type: String,
      default: '',
      maxlength: 500,
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    loggedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

moodLogSchema.index({ userId: 1, loggedAt: -1 });

module.exports = mongoose.model('MoodLog', moodLogSchema);
