// favoriteController — CRUD + search for user favorites
const { validationResult } = require('express-validator');
const Favorite = require('../models/Favorite');
const asyncHandler = require('../utils/asyncHandler');

exports.addFavorite = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { contentType, externalId, title, thumbnail = '' } = req.body;

  try {
    const fav = await Favorite.create({
      userId: req.user._id,
      contentType,
      externalId,
      title,
      thumbnail,
    });
    return res.status(201).json({ success: true, data: { favorite: fav } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already in favorites' });
    }
    throw err;
  }
});

exports.getFavorites = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.contentType) filter.contentType = req.query.contentType;

  const [items, total] = await Promise.all([
    Favorite.find(filter).sort({ savedAt: -1 }).skip(skip).limit(limit),
    Favorite.countDocuments(filter),
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

exports.removeFavorite = asyncHandler(async (req, res) => {
  const fav = await Favorite.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!fav) {
    return res.status(404).json({ success: false, message: 'Favorite not found' });
  }
  return res.json({ success: true, message: 'Favorite removed' });
});

exports.checkFavorite = asyncHandler(async (req, res) => {
  const fav = await Favorite.findOne({
    userId: req.user._id,
    externalId: req.params.externalId,
  });
  return res.json({
    success: true,
    data: { isFavorite: !!fav, favoriteId: fav?._id || null },
  });
});

exports.searchFavorites = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.json({ success: true, data: { items: [] } });
  }

  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(safe, 'i');

  const items = await Favorite.find({
    userId: req.user._id,
    title: regex,
  })
    .sort({ savedAt: -1 })
    .limit(50);

  return res.json({ success: true, data: { items } });
});
