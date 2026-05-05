// moodboardController — OpenAI mood analysis + Unsplash image curation
const axios = require('axios');
const OpenAI = require('openai');
const asyncHandler = require('../utils/asyncHandler');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const UNSPLASH_BASE = 'https://api.unsplash.com';

const STOP_WORDS = new Set([
  'a', 'about', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by',
  'for', 'from', 'get', 'got', 'had', 'has', 'have', 'i', 'if', 'im', "i'm", 'in', 'into',
  'is', 'it', 'its', 'just', 'like', 'me', 'my', 'of', 'on', 'or', 'our', 'so', 'that',
  'the', 'this', 'to', 'up', 'very', 'was', 'we', 'were', 'with', 'you', 'your',
]);

const MOOD_QUERY_MAP = [
  {
    moods: ['happy', 'joyful', 'cheerful', 'bright', 'sunny', 'uplifting'],
    queries: [
      'golden hour picnic',
      'sunlit meadow',
      'colorful farmers market',
      'summer flowers',
      'outdoor brunch',
      'playful balloons',
      'candid friends',
    ],
  },
  {
    moods: ['calm', 'peaceful', 'serene', 'gentle', 'quiet', 'still'],
    queries: [
      'soft morning light',
      'linen bedroom',
      'quiet lake',
      'warm tea',
      'minimal home interior',
      'cloudy sky',
      'slow morning',
      'neutral textures',
    ],
  },
  {
    moods: ['romantic', 'love', 'romance', 'tender'],
    queries: [
      'candlelit dinner',
      'pink flowers',
      'handwritten love letter',
      'paris balcony',
      'soft lace',
      'vintage perfume',
      'rose garden',
      'warm cafe',
    ],
  },
  {
    moods: ['nostalgic', 'nostalgia', 'retro', 'vintage', 'memory', 'memories'],
    queries: [
      'film photography',
      'vintage bedroom',
      'old postcards',
      'record player',
      'faded polaroids',
      'analog camera',
      'retro diner',
      'handwritten notes',
    ],
  },
  {
    moods: ['dreamy', 'ethereal', 'whimsical', 'surreal'],
    queries: [
      'pastel clouds',
      'moonlit window',
      'soft focus flowers',
      'sheer curtains',
      'sunset haze',
      'ethereal landscape',
      'fairy lights',
    ],
  },
  {
    moods: ['energetic', 'bold', 'electric', 'lively', 'vibrant'],
    queries: [
      'neon city night',
      'concert lights',
      'motion blur',
      'street style',
      'colorful posters',
      'disco ball',
      'dancing crowd',
    ],
  },
  {
    moods: ['cozy', 'comforting', 'warm', 'snug', 'hygge'],
    queries: [
      'rainy window',
      'warm coffee',
      'knitted blanket',
      'candlelight',
      'old books',
      'cozy cabin',
      'soft lamp light',
      'autumn interior',
    ],
  },
  {
    moods: ['feminine', 'soft', 'delicate', 'girly'],
    queries: [
      'satin ribbons',
      'ballet flats',
      'pearl jewelry',
      'pink roses',
      'vanity table',
      'lace details',
      'soft makeup',
      'silk fabric',
    ],
  },
  {
    moods: ['edgy', 'moody', 'dark', 'gritty', 'rebellious'],
    queries: [
      'leather jacket',
      'dark street',
      'chrome details',
      'smoky room',
      'black boots',
      'graffiti wall',
      'flash photography',
    ],
  },
  {
    moods: ['academic', 'study', 'scholarly', 'intellectual'],
    queries: [
      'old library',
      'annotated books',
      'coffee notes',
      'vintage desk',
      'fountain pen',
      'study corner',
      'warm lamp',
    ],
  },
  {
    moods: ['travel', 'escape', 'wanderlust', 'vacation', 'journey'],
    queries: [
      'train window',
      'passport stamps',
      'seaside town',
      'vintage suitcase',
      'hotel balcony',
      'narrow street',
      'postcard wall',
    ],
  },
  {
    moods: ['party', 'fun', 'celebration', 'festive'],
    queries: [
      'disco ball',
      'colorful lights',
      'champagne glasses',
      'confetti',
      'dance floor',
      'glitter makeup',
      'neon signs',
    ],
  },
  {
    moods: ['sad', 'melancholic', 'melancholy', 'lonely', 'heartbroken'],
    queries: [
      'rainy street',
      'empty room',
      'blue hour',
      'foggy window',
      'wilted flowers',
      'lonely beach',
      'soft shadows',
    ],
  },
];

const SCENE_BUCKETS = {
  environment: ['street', 'terrace', 'balcony', 'cafe', 'lake', 'beach', 'meadow', 'library', 'room', 'interior', 'landscape', 'garden', 'market', 'park', 'town'],
  closeup: ['coffee', 'croissant', 'flowers', 'perfume', 'jewelry', 'makeup', 'tea', 'books', 'letter', 'camera', 'boots'],
  texture: ['linen', 'lace', 'silk', 'satin', 'curtains', 'textures', 'blanket', 'shadows', 'haze'],
  object: ['postcards', 'record', 'passport', 'suitcase', 'balloons', 'lights', 'pen', 'desk', 'window'],
};

const uniq = (items) => [...new Set(items.filter(Boolean))];

const sanitizePhrase = (value) => String(value || '')
  .toLowerCase()
  .replace(/["'.!?]/g, ' ')
  .replace(/[^a-z0-9\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const classifyQuery = (query) => {
  const normalized = sanitizePhrase(query);
  if (SCENE_BUCKETS.texture.some((term) => normalized.includes(term))) return 'texture';
  if (SCENE_BUCKETS.closeup.some((term) => normalized.includes(term))) return 'closeup';
  if (SCENE_BUCKETS.object.some((term) => normalized.includes(term))) return 'object';
  if (SCENE_BUCKETS.environment.some((term) => normalized.includes(term))) return 'environment';
  return 'environment';
};

const pickWords = (prompt) => uniq(
  sanitizePhrase(prompt)
    .split(' ')
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
);

const collectMappedQueries = (prompt) => {
  const normalized = sanitizePhrase(prompt);
  return uniq(
    MOOD_QUERY_MAP.flatMap(({ moods, queries }) => (
      moods.some((mood) => normalized.includes(mood)) ? queries : []
    ))
  );
};

const buildPromptQueries = (prompt) => {
  const normalized = sanitizePhrase(prompt);
  const phrases = [];

  if (normalized.includes('paris')) {
    phrases.push('paris cafe terrace', 'sunlit paris street', 'paris balcony morning');
  }
  if (normalized.includes('cafe') || normalized.includes('coffee')) {
    phrases.push('warm cafe interior', 'croissant coffee', 'coffee on linen table');
  }
  if (normalized.includes('sunday') || normalized.includes('morning')) {
    phrases.push('slow sunday morning', 'warm morning light');
  }
  if (normalized.includes('beach') || normalized.includes('sea') || normalized.includes('ocean')) {
    phrases.push('seaside town', 'windy beach walk', 'sunlit ocean horizon');
  }
  if (normalized.includes('city')) {
    phrases.push('editorial city street photography', 'city window reflections');
  }
  if (normalized.includes('home') || normalized.includes('bedroom')) {
    phrases.push('soft bedroom interior', 'linen sheets morning light');
  }
  if (normalized.includes('rain') || normalized.includes('rainy')) {
    phrases.push('rainy window light', 'wet street reflections');
  }

  const words = pickWords(prompt);
  if (words.length >= 2) {
    phrases.push(`${words.slice(0, 2).join(' ')} editorial photography`);
  }
  if (words.length >= 3) {
    phrases.push(`${words.slice(0, 3).join(' ')}`);
  }

  return uniq(phrases);
};

const buildVisualSearchQueries = (prompt, vibeKeywords = []) => {
  const mapped = collectMappedQueries(prompt);
  const promptBased = buildPromptQueries(prompt);
  const aiKeywords = uniq(vibeKeywords.map(sanitizePhrase))
    .filter((phrase) => phrase.split(' ').length >= 2)
    .slice(0, 4);

  const combined = uniq([...mapped, ...promptBased, ...aiKeywords]).filter((phrase) => {
    const words = sanitizePhrase(phrase).split(' ').filter(Boolean);
    return words.length >= 2 && words.length <= 6;
  });

  const selected = [];
  const usedBuckets = new Set();
  const bucketOrder = ['environment', 'closeup', 'texture', 'object'];

  bucketOrder.forEach((bucket) => {
    const match = combined.find((phrase) => classifyQuery(phrase) === bucket && !selected.includes(phrase));
    if (match) {
      selected.push(match);
      usedBuckets.add(bucket);
    }
  });

  combined.forEach((phrase) => {
    if (selected.length >= 6) return;
    const bucket = classifyQuery(phrase);
    if (!usedBuckets.has(bucket) || selected.length < 4) {
      selected.push(phrase);
      usedBuckets.add(bucket);
      return;
    }
    if (!selected.includes(phrase)) selected.push(phrase);
  });

  return selected.slice(0, Math.max(3, Math.min(6, selected.length)));
};

const analyzeMoodForBoard = async (prompt) => {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: 'You are a creative moodboard curator. Respond ONLY with valid JSON.',
      },
      {
        role: 'user',
        content: `Analyze this mood/vibe prompt and generate moodboard curation data.

Prompt: "${prompt}"

Return ONLY this exact JSON:
{
  "vibeTitle": "2-4 poetic words (e.g. Rainy Nostalgia)",
  "vibeDescription": "One atmospheric sentence, max 18 words",
  "keywords": ["6 specific Unsplash-searchable photography terms, e.g. rainy window bokeh, vintage lamp warm light, misty street at night"],
  "palette": ["5 hex color codes matching the mood"],
  "decorations": ["5 items from: stars, hearts, bows, flowers, arrows, sparkles, stamps, lemons, ribbons, moons, clouds, leaves, film, coffee"]
}

Rules:
- keywords must be photographic scene descriptions, not abstract concepts
- palette must feel emotionally consistent with the mood
- decorations must match the vibe aesthetically`,
      },
    ],
  });
  return JSON.parse(response.choices[0]?.message?.content || '{}');
};

const fetchUnsplashForKeyword = async (keyword) => {
  const { data } = await axios.get(`${UNSPLASH_BASE}/search/photos`, {
    params: { query: keyword, per_page: 3, orientation: 'landscape', content_filter: 'high' },
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    timeout: 8000,
  });
  return (data.results || []).map((photo) => ({
    id: String(photo.id),
    url: photo.urls?.regular || photo.urls?.full || '',
    thumb: photo.urls?.small || photo.urls?.thumb || '',
    photographer: photo.user?.name || '',
    link: photo.links?.html || '',
    keyword,
    bucket: classifyQuery(keyword),
    alt: sanitizePhrase(photo.alt_description || photo.description || ''),
  }));
};

const dedupeImages = (images) => {
  const seenIds = new Set();
  const seenKeys = new Set();

  return images.filter((image) => {
    if (!image?.id || seenIds.has(image.id)) return false;
    const visualKey = sanitizePhrase([
      image.photographer,
      image.alt,
      image.keyword.split(' ').slice(0, 3).join(' '),
    ].join(' '));
    if (seenKeys.has(visualKey)) return false;
    seenIds.add(image.id);
    seenKeys.add(visualKey);
    return true;
  });
};

const curateImages = (images, limit = 8) => {
  const deduped = dedupeImages(images);
  const buckets = ['environment', 'closeup', 'texture', 'object'];
  const selected = [];

  buckets.forEach((bucket) => {
    const match = deduped.find((image) => image.bucket === bucket && !selected.includes(image));
    if (match) selected.push(match);
  });

  deduped.forEach((image) => {
    if (selected.length < limit && !selected.includes(image)) selected.push(image);
  });

  return selected.slice(0, limit);
};

const fetchAllImages = async (keywords) => {
  if (!process.env.UNSPLASH_ACCESS_KEY) return [];
  const settled = await Promise.allSettled(
    keywords.slice(0, 6).map((kw) => fetchUnsplashForKeyword(kw))
  );
  const images = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  return curateImages(images, 8);
};

exports.generateMoodboard = asyncHandler(async (req, res) => {
  const prompt = String(req.body?.prompt ?? '').trim().slice(0, 400);
  if (prompt.length < 3) {
    return res.status(422).json({ success: false, message: 'Prompt must be at least 3 characters' });
  }

  let vibe;
  try {
    vibe = await analyzeMoodForBoard(prompt);
  } catch (err) {
    return res.status(502).json({ success: false, message: 'AI service unavailable', detail: err.message });
  }

  const aiKeywords = Array.isArray(vibe.keywords) ? vibe.keywords.filter(Boolean) : [];
  const keywords = buildVisualSearchQueries(prompt, aiKeywords);
  const images = await fetchAllImages(keywords);

  return res.json({
    success: true,
    data: {
      vibeTitle: String(vibe.vibeTitle || 'My Moodboard').trim(),
      vibeDescription: String(vibe.vibeDescription || '').trim(),
      keywords,
      palette: Array.isArray(vibe.palette) ? vibe.palette.slice(0, 5) : ['#e8e0d5', '#c4a882', '#2c2c2c', '#8b6e4e', '#f0ebe2'],
      decorations: Array.isArray(vibe.decorations) ? vibe.decorations.slice(0, 5) : ['stars', 'hearts'],
      images,
    },
  });
});
