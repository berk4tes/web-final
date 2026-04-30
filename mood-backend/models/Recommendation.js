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
      enum: ['movie', 'series', 'music', 'book'],
      required: true,
    },
    title: { type: String, required: true },
    externalId: { type: String, default: '' },
    source: {
      type: String,
      enum: ['tmdb', 'spotify', 'openlibrary', 'lastfm', 'applemusic', 'googlebooks'],
      default: 'tmdb',
    },
    poster: { type: String, default: '' },
    appleUrl: { type: String, default: '' },
    overview: { type: String, default: '' },
    runtime: { type: Number, default: null },
    rating: { type: Number, default: null },
    releaseYear: { type: String, default: '' },
    directors: { type: [String], default: [] },
    cast: { type: [String], default: [] },
    providers: { type: [String], default: [] },
    providerLogos: {
      type: [{ name: String, logo: String, link: String, type: String }],
      default: [],
    },
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
