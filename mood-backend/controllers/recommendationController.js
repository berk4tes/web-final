// recommendationController — Claude-powered AI recommendations enriched with TMDB metadata
const axios = require('axios');
const { validationResult } = require('express-validator');
const MoodLog = require('../models/MoodLog');
const Recommendation = require('../models/Recommendation');
const asyncHandler = require('../utils/asyncHandler');
const { generateRecommendations, interpretVibe } = require('../utils/aiService');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const OPENLIBRARY_BASE = process.env.OPENLIBRARY_BASE_URL || 'https://openlibrary.org';
const OPENLIBRARY_COVER_BASE = 'https://covers.openlibrary.org/b/id';

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
      source: 'tmdb',
      externalId: String(first.id),
      poster: first.poster_path ? `${TMDB_IMAGE_BASE}${first.poster_path}` : '',
      overview: first.overview || '',
    };
  } catch (err) {
    console.warn(`TMDB lookup failed for "${title}":`, err.message);
    return null;
  }
};

const enrichWithOpenLibrary = async (title) => {
  try {
    const { data } = await axios.get(`${OPENLIBRARY_BASE}/search.json`, {
      params: { q: title, limit: 1 },
      timeout: 8000,
    });
    const first = (data.docs || [])[0];
    if (!first) return null;
    const externalId = first.key ? first.key.replace(/^\/works\//, '') : '';
    const author = (first.author_name || []).slice(0, 2).join(', ');
    const overview = author
      ? `${author}${first.first_publish_year ? ` (${first.first_publish_year})` : ''}`
      : '';
    return {
      source: 'openlibrary',
      externalId,
      poster: first.cover_i ? `${OPENLIBRARY_COVER_BASE}/${first.cover_i}-L.jpg` : '',
      overview,
    };
  } catch (err) {
    console.warn(`Open Library lookup failed for "${title}":`, err.message);
    return null;
  }
};

const enrichRecommendation = async (title, contentType) => {
  if (contentType === 'movie' || contentType === 'series') {
    return enrichWithTmdb(title, contentType);
  }
  if (contentType === 'book') {
    return enrichWithOpenLibrary(title);
  }
  return null;
};

const defaultSourceFor = (contentType) => {
  if (contentType === 'music') return 'spotify';
  if (contentType === 'book') return 'openlibrary';
  return 'tmdb';
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
      const meta = await enrichRecommendation(s.title, contentType);
      return {
        moodLogId: moodLog._id,
        userId: req.user._id,
        contentType,
        title: s.title,
        externalId: meta?.externalId || '',
        source: meta?.source || defaultSourceFor(contentType),
        poster: meta?.poster || '',
        overview: meta?.overview || '',
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

const COLOR_TO_MOOD_LABEL = {
  calm: 'calm',
  sad: 'sad',
  nostalgic: 'nostalgic',
  angry: 'angry',
  dreamy: 'calm',
  happy: 'happy',
  excited: 'excited',
};

exports.generateVibe = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { prompt } = req.body;

  let vibe;
  try {
    vibe = await interpretVibe(prompt);
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: 'AI vibe interpretation is unavailable',
      detail: err.message,
    });
  }

  const moodLabel = COLOR_TO_MOOD_LABEL[vibe.mood.colorKey] || 'calm';
  const intensityNumber = Math.max(1, Math.min(10, Math.round(vibe.mood.intensity * 10)));

  const moodLog = await MoodLog.create({
    userId: req.user._id,
    moodLabel,
    moodText: prompt,
    intensity: intensityNumber,
  });

  const enrichList = async (items, contentType) =>
    Promise.all(
      (items || []).map(async (s) => {
        const meta = await enrichRecommendation(s.title, contentType);
        return {
          moodLogId: moodLog._id,
          userId: req.user._id,
          contentType,
          title: s.title,
          externalId: meta?.externalId || '',
          source: meta?.source || defaultSourceFor(contentType),
          poster: meta?.poster || '',
          overview: meta?.overview || s.artist || '',
          genre: s.genre || '',
          aiExplanation: s.reason || '',
          artist: s.artist || '',
        };
      })
    );

  const [music, movies, books] = await Promise.all([
    enrichList(vibe.music, 'music'),
    enrichList(vibe.movies, 'movie'),
    enrichList(vibe.books, 'book'),
  ]);

  const persistable = (item) => {
    const { artist, ...rest } = item;
    return rest;
  };

  await Recommendation.insertMany([
    ...music.map(persistable),
    ...movies.map(persistable),
    ...books.map(persistable),
  ]);

  return res.status(201).json({
    success: true,
    data: {
      prompt,
      mood: vibe.mood,
      moodLog,
      sections: { music, movies, books },
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
