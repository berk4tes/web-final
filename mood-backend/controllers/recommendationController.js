// recommendationController — Claude-powered AI recommendations enriched with TMDB metadata
const axios = require('axios');
const { validationResult } = require('express-validator');
const MoodLog = require('../models/MoodLog');
const Recommendation = require('../models/Recommendation');
const asyncHandler = require('../utils/asyncHandler');
const { generateRecommendations, interpretVibe } = require('../utils/aiService');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_REGION = process.env.TMDB_REGION || 'TR';
const OPENLIBRARY_BASE = process.env.OPENLIBRARY_BASE_URL || 'https://openlibrary.org';
const OPENLIBRARY_COVER_BASE = 'https://covers.openlibrary.org/b/id';
const ITUNES_BASE = 'https://itunes.apple.com/search';
const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';

const pickProviders = (watchProviders = {}) => {
  const regionData = watchProviders.results?.[TMDB_REGION] || watchProviders.results?.US || {};
  const groups = [
    { type: 'stream', items: regionData.flatrate || [] },
    { type: 'rent', items: regionData.rent || [] },
    { type: 'buy', items: regionData.buy || [] },
  ];
  const firstAvailableGroup = groups.find((group) => group.items.length);
  const activeGroups = firstAvailableGroup ? [firstAvailableGroup] : [];
  const uniqueProviders = [];
  const seen = new Set();
  activeGroups.forEach((group) => {
    group.items.forEach((provider) => {
      if (!provider.provider_name || seen.has(provider.provider_name)) return;
      seen.add(provider.provider_name);
      uniqueProviders.push({ ...provider, availabilityType: group.type });
    });
  });
  const picked = uniqueProviders.slice(0, 5);
  return {
    providers: picked.map((provider) => provider.provider_name),
    providerLogos: picked.map((provider) => ({
      name: provider.provider_name,
      logo: provider.logo_path ? `${TMDB_IMAGE_BASE}${provider.logo_path}` : '',
      link: regionData.link || '',
      type: provider.availabilityType || '',
    })),
  };
};

const enrichWithTmdb = async (title, contentType) => {
  if (!process.env.TMDB_API_KEY) return null;
  if (contentType !== 'movie' && contentType !== 'series') return null;

  const path = contentType === 'series' ? '/search/tv' : '/search/multi';
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
    const first = (data.results || []).find((item) => (
      contentType === 'series'
        ? item.media_type === 'tv' || item.name
        : item.media_type === 'movie' || item.media_type === 'tv' || item.title || item.name
    ));
    if (!first) return null;
    const mediaType = first.media_type || (contentType === 'series' ? 'tv' : 'movie');
    const detailPath = mediaType === 'tv' ? `/tv/${first.id}` : `/movie/${first.id}`;
    const { data: detail } = await axios.get(`${TMDB_BASE}${detailPath}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        append_to_response: 'credits,watch/providers',
        language: 'en-US',
      },
      timeout: 8000,
    });
    const credits = detail.credits || {};
    const crew = credits.crew || [];
    const directors = mediaType === 'tv'
      ? (detail.created_by || []).map((person) => person.name).filter(Boolean)
      : crew.filter((person) => person.job === 'Director').map((person) => person.name).filter(Boolean);
    const runtime = mediaType === 'tv'
      ? (detail.episode_run_time || [])[0] || null
      : detail.runtime || null;
    const date = detail.release_date || detail.first_air_date || first.release_date || first.first_air_date || '';
    const providerDetails = pickProviders(detail['watch/providers']);
    return {
      source: 'tmdb',
      externalId: String(first.id),
      poster: (detail.poster_path || first.poster_path) ? `${TMDB_IMAGE_BASE}${detail.poster_path || first.poster_path}` : '',
      overview: detail.overview || first.overview || '',
      runtime,
      rating: Number.isFinite(detail.vote_average) ? Number(detail.vote_average.toFixed(1)) : null,
      releaseYear: date ? String(date).slice(0, 4) : '',
      directors: directors.slice(0, 2),
      cast: (credits.cast || []).slice(0, 5).map((person) => person.name).filter(Boolean),
      providers: providerDetails.providers,
      providerLogos: providerDetails.providerLogos,
      genre: (detail.genres || []).slice(0, 2).map((genre) => genre.name).filter(Boolean).join(' / '),
      mediaType,
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

const enrichWithGoogleBooks = async (title) => {
  try {
    const { data } = await axios.get(GOOGLE_BOOKS_BASE, {
      params: { q: title, maxResults: 1, printType: 'books' },
      timeout: 8000,
    });
    const first = (data.items || [])[0];
    if (!first) return null;
    const info = first.volumeInfo || {};
    const imageLinks = info.imageLinks || {};
    const poster = (imageLinks.thumbnail || imageLinks.smallThumbnail || '')
      .replace(/^http:/, 'https:')
      .replace('&edge=curl', '');
    const authors = (info.authors || []).slice(0, 2).join(', ');
    const year = info.publishedDate ? String(info.publishedDate).slice(0, 4) : '';
    return {
      source: 'googlebooks',
      externalId: first.id || title,
      poster,
      overview: authors ? `${authors}${year ? ` (${year})` : ''}` : '',
    };
  } catch (err) {
    console.warn(`Google Books lookup failed for "${title}":`, err.message);
    return null;
  }
};

const enrichBook = async (title) => {
  const openLibrary = await enrichWithOpenLibrary(title);
  if (openLibrary?.poster) return openLibrary;
  const googleBooks = await enrichWithGoogleBooks(title);
  if (googleBooks?.poster) {
    return {
      ...googleBooks,
      overview: openLibrary?.overview || googleBooks.overview,
    };
  }
  return openLibrary || googleBooks;
};

const enrichWithItunes = async (title, artist = '') => {
  try {
    const { data } = await axios.get(ITUNES_BASE, {
      params: {
        term: `${title} ${artist}`.trim(),
        media: 'music',
        entity: 'song',
        limit: 1,
      },
      timeout: 8000,
    });
    const first = (data.results || [])[0];
    if (!first) return null;
    return {
      source: 'applemusic',
      externalId: String(first.trackId || `${title}-${artist}`),
      poster: (first.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
      overview: first.artistName || artist,
      appleUrl: first.trackViewUrl || '',
    };
  } catch (err) {
    console.warn(`iTunes lookup failed for "${title}":`, err.message);
    return null;
  }
};

const enrichRecommendation = async (title, contentType, artist = '') => {
  if (contentType === 'movie' || contentType === 'series') {
    return enrichWithTmdb(title, contentType);
  }
  if (contentType === 'book') {
    return enrichBook(title);
  }
  if (contentType === 'music') {
    return enrichWithItunes(title, artist);
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
      const meta = await enrichRecommendation(s.title, contentType, s.artist);
      return {
        moodLogId: moodLog._id,
        userId: req.user._id,
        contentType,
        title: s.title,
        externalId: meta?.externalId || '',
        source: meta?.source || defaultSourceFor(contentType),
        poster: meta?.poster || '',
        overview: meta?.overview || '',
        runtime: meta?.runtime || null,
        rating: meta?.rating || null,
        releaseYear: meta?.releaseYear || '',
        directors: meta?.directors || [],
        cast: meta?.cast || [],
        providers: meta?.providers || [],
        providerLogos: meta?.providerLogos || [],
        genre: s.genre || '',
        aiExplanation: s.reason || '',
        appleUrl: meta?.appleUrl || '',
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
  romantic: 'excited',
  dreamy: 'calm',
  happy: 'happy',
  excited: 'excited',
  cinematic: 'excited',
  fresh: 'calm',
};

const PROMPT_MOOD_KEYWORDS = [
  { mood: 'nostalgic', words: ['autumn', 'fall', 'vintage', 'memory', 'old', 'sonbahar', 'nostalji'] },
  { mood: 'happy', words: ['paris', 'parisian', 'cafe', 'sun', 'sunny', 'golden', 'laugh', 'mutlu', 'gunes'] },
  { mood: 'excited', words: ['love', 'romance', 'crush', 'passion', 'heart', 'rose', 'ask', 'aşk', 'sevgi', 'sevgili', 'tutku', 'kalp', 'kirmizi gul', 'kırmızı gül'] },
  { mood: 'sad', words: ['sad', 'rain', 'lonely', 'heartbreak', 'empty', 'uzgun', 'yalniz', 'huzun'] },
  { mood: 'calm', words: ['calm', 'quiet', 'peace', 'soft', 'garden', 'sakin', 'huzur'] },
  { mood: 'excited', words: ['electric', 'party', 'gym', 'adrenaline', 'energetic', 'enerjik', 'heyecan'] },
  { mood: 'angry', words: ['angry', 'storm', 'chaos', 'rage', 'dark', 'ofke', 'kizgin'] },
  { mood: 'calm', words: ['fresh', 'clean', 'ocean', 'spring rain', 'ferah', 'temiz', 'deniz'] },
  { mood: 'calm', words: ['dream', 'dreamy', 'fog', 'moon', 'romantic', 'ruya', 'romantik'] },
];

const normalizePrompt = (value = '') =>
  value
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const inferMoodLabelFromPrompt = (prompt = '') => {
  const normalized = normalizePrompt(prompt);
  let best = null;
  let bestScore = 0;
  for (const group of PROMPT_MOOD_KEYWORDS) {
    const score = group.words.reduce((total, word) => (
      normalized.includes(normalizePrompt(word)) ? total + word.length : total
    ), 0);
    if (score > bestScore) {
      best = group.mood;
      bestScore = score;
    }
  }
  return best;
};

exports.generateVibe = asyncHandler(async (req, res) => {
  const prompt = String(req.body?.prompt ?? req.body?.moodText ?? req.body?.query ?? '').trim().slice(0, 500);
  if (prompt.length < 3) {
    return res.status(422).json({
      success: false,
      message: 'Prompt must be at least 3 characters',
    });
  }

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

  const moodLabel = inferMoodLabelFromPrompt(prompt) || COLOR_TO_MOOD_LABEL[vibe.mood.colorKey] || 'calm';
  const intensityNumber = Math.max(1, Math.min(10, Math.round(vibe.mood.intensity * 10)));
  const userId = req.user?._id;

  const moodLog = userId
    ? await MoodLog.create({
        userId,
        moodLabel,
        moodText: prompt,
        intensity: intensityNumber,
      })
    : null;

  const normalizeMovieType = (item) => (
    item?.contentType === 'series' || item?.type === 'series' || item?.mediaType === 'series'
      ? 'series'
      : 'movie'
  );

  const enrichList = async (items, contentType) =>
    Promise.all(
      (items || []).map(async (s) => {
        const itemType = contentType === 'movie' ? normalizeMovieType(s) : contentType;
        const meta = await enrichRecommendation(s.title, itemType, s.artist);
        return {
          ...(moodLog?._id ? { moodLogId: moodLog._id } : {}),
          ...(userId ? { userId } : {}),
          contentType: itemType,
          title: s.title,
          externalId: meta?.externalId || '',
          source: meta?.source || defaultSourceFor(itemType),
          poster: meta?.poster || '',
          overview: meta?.overview || s.artist || '',
          runtime: meta?.runtime || null,
          rating: meta?.rating || null,
          releaseYear: meta?.releaseYear || '',
          directors: meta?.directors || [],
          cast: meta?.cast || [],
          providers: meta?.providers || [],
          providerLogos: meta?.providerLogos || [],
          genre: s.genre || '',
          aiExplanation: s.reason || '',
          artist: s.artist || '',
          appleUrl: meta?.appleUrl || '',
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

  if (userId && moodLog?._id) {
    await Recommendation.insertMany([
      ...music.map(persistable),
      ...movies.map(persistable),
      ...books.map(persistable),
    ]);
  }

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

exports.getTmdbDetails = asyncHandler(async (req, res) => {
  const title = String(req.query.title || '').trim();
  const contentType = req.query.contentType === 'series' ? 'series' : 'movie';

  if (!title) {
    return res.status(422).json({ success: false, message: 'title query is required' });
  }

  const details = await enrichWithTmdb(title, contentType);
  if (!details) {
    return res.status(404).json({ success: false, message: 'TMDB details not found' });
  }

  return res.json({ success: true, data: { details } });
});
