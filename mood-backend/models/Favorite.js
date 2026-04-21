// Favorite — items the user has bookmarked across recommendations
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
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
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    savedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

favoriteSchema.index({ userId: 1, externalId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, savedAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
