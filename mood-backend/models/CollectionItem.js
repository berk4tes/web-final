// CollectionItem — user media marked as watched or read
const mongoose = require('mongoose');

const collectionItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['watched', 'read'],
      required: true,
    },
    contentType: {
      type: String,
      enum: ['movie', 'series', 'book'],
      required: true,
    },
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

collectionItemSchema.index({ userId: 1, type: 1, externalId: 1 }, { unique: true });
collectionItemSchema.index({ userId: 1, type: 1, recordedAt: -1 });

module.exports = mongoose.model('CollectionItem', collectionItemSchema);
