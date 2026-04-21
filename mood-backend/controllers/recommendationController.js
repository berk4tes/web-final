// recommendationController — Claude-powered AI recommendations enriched with TMDB metadata
const axios = require('axios');
const { validationResult } = require('express-validator');
const MoodLog = require('../models/MoodLog');
const Recommendation = require('../models/Recommendation');
const asyncHandler = require('../utils/asyncHandler');
const { generateRecommendations } = require('../utils/claudeService');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const enrichWithTmdb = async (title, contentType) => {
  if (!process.env.TMDB_API_KEY) return null;
  if (contentType !== 'movie' && contentType !== 'series') return null;

  const path = contentType === 'movie' ? '/search/movie' : '/search/tv';
  try {
    const { data } = await axios.get(`${TMDB_BASE}${path}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: title,
        include_adult: false,
        language: 'en-US',
        page: 1,
      },
      timeout: 8000,
    });
    const first = (data.results || [])[0];
    if (!first) return null;
    return {
      externalId: String(first.id),
      poster: first.poster_path ? `${TMDB_IMAGE_BASE}${first.poster_path}` : '',
      overview: first.overview || '',
    };
  } catch (err) {
    console.warn(`TMDB lookup failed for "${title}":`, err.message);
    return null;
  }
};

exports.generateRecommendations = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { moodLabel, moodText = '', intensity, contentType } = req.body;

  const moodLog = await MoodLog.create({
    userId: req.user._id,
    moodLabel,
    moodText,
    intensity,
  });

  let suggestions;
  try {
    suggestions = await generateRecommendations(moodLabel, moodText, intensity, contentType);
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: 'AI recommendation service is unavailable',
      detail: err.message,
    });
  }

  const enriched = await Promise.all(
    suggestions.map(async (s) => {
      const tmdb = await enrichWithTmdb(s.title, contentType);
      return {
        moodLogId: moodLog._id,
        userId: req.user._id,
        contentType,
        title: s.title,
        externalId: tmdb?.externalId || '',
        source: contentType === 'music' ? 'spotify' : 'tmdb',
        poster: tmdb?.poster || '',
        overview: tmdb?.overview || '',
        genre: s.genre || '',
        aiExplanation: s.reason || '',
      };
    })
  );

  const created = await Recommendation.insertMany(enriched);

  return res.status(201).json({
    success: true,
    data: {
      moodLog,
      recommendations: created,
    },
  });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.contentType) {
    filter.contentType = req.query.contentType;
  }
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
  }

  const [items, total] = await Promise.all([
    Recommendation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Recommendation.countDocuments(filter),
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

exports.getById = asyncHandler(async (req, res) => {
  const rec = await Recommendation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!rec) {
    return res.status(404).json({ success: false, message: 'Recommendation not found' });
  }
  return res.json({ success: true, data: { recommendation: rec } });
});
