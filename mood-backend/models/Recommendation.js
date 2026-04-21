// Recommendation — a single AI-generated suggestion tied to a mood log
const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    moodLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MoodLog',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['movie', 'series', 'music'],
      required: true,
    },
    title: { type: String, required: true },
    externalId: { type: String, default: '' },
    source: {
      type: String,
      enum: ['tmdb', 'spotify'],
      default: 'tmdb',
    },
    poster: { type: String, default: '' },
    overview: { type: String, default: '' },
    genre: { type: String, default: '' },
    aiExplanation: { type: String, default: '' },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

recommendationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
