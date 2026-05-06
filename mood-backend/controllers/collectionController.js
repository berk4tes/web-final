// collectionController — watched/read collection persistence
const { validationResult } = require('express-validator');
const CollectionItem = require('../models/CollectionItem');
const asyncHandler = require('../utils/asyncHandler');

exports.addCollectionItem = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { type, contentType, externalId, title, thumbnail = '' } = req.body;
  const recordedAt = new Date();

  const item = await CollectionItem.findOneAndUpdate(
    { userId: req.user._id, type, externalId },
    {
      $setOnInsert: {
        userId: req.user._id,
        type,
        externalId,
      },
      $set: {
        contentType,
        title,
        thumbnail,
        recordedAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(201).json({ success: true, data: { item } });
});

exports.getCollectionItems = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 100));
  const filter = { userId: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const items = await CollectionItem.find(filter)
    .sort({ recordedAt: -1 })
    .limit(limit);

  return res.json({ success: true, data: { items } });
});

exports.removeCollectionItem = asyncHandler(async (req, res) => {
  const item = await CollectionItem.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Collection item not found' });
  }

  return res.json({ success: true, message: 'Collection item removed' });
});
