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
      'sunlit flowers',
      'summer picnic',
      'colorful street',
      'bright market',
      'blue sky',
      'fresh fruit',
      'warm window',
      'soft brunch',
    ],
  },
  {
    moods: ['calm', 'peaceful', 'serene', 'gentle', 'quiet', 'still'],
    queries: [
      'soft light',
      'quiet room',
      'neutral interior',
      'cloudy sky',
      'calm water',
      'minimal space',
      'linen table',
      'paper shadows',
    ],
  },
  {
    moods: ['romantic', 'love', 'romance', 'tender'],
    queries: [
      'pink flowers',
      'soft fabric',
      'candle light',
      'warm glow',
      'vintage table',
      'intimate space',
      'lace details',
      'rose shadows',
    ],
  },
  {
    moods: ['nostalgic', 'nostalgia', 'retro', 'vintage', 'memory', 'memories'],
    queries: [
      'film photo',
      'vintage room',
      'old paper',
      'retro objects',
      'faded colors',
      'soft grain',
      'dusty light',
      'warm desk',
    ],
  },
  {
    moods: ['dreamy', 'ethereal', 'whimsical', 'surreal'],
    queries: [
      'pastel sky',
      'soft clouds',
      'blur light',
      'moon glow',
      'ethereal light',
      'misty scene',
      'sheer curtain',
      'soft flowers',
    ],
  },
  {
    moods: ['energetic', 'bold', 'electric', 'lively', 'vibrant'],
    queries: [
      'neon lights',
      'city night',
      'colorful lights',
      'crowd motion',
      'bright signs',
      'urban energy',
      'flash street',
      'night blur',
    ],
  },
  {
    moods: ['cozy', 'comforting', 'warm', 'snug', 'hygge'],
    queries: [
      'warm coffee',
      'knit blanket',
      'candle light',
      'rainy window',
      'soft shadows',
      'wood interior',
      'old books',
      'warm corner',
    ],
  },
  {
    moods: ['feminine', 'soft', 'delicate', 'girly'],
    queries: [
      'pink roses',
      'soft ribbon',
      'silk fabric',
      'pearl detail',
      'vanity table',
      'lace texture',
      'powder light',
      'satin shoes',
    ],
  },
  {
    moods: ['edgy', 'moody', 'dark', 'gritty', 'rebellious'],
    queries: [
      'dark street',
      'flash photo',
      'smoke shadows',
      'chrome detail',
      'black boots',
      'graffiti wall',
      'leather detail',
      'night window',
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
      'paper stack',
    ],
  },
  {
    moods: ['travel', 'escape', 'wanderlust', 'vacation', 'journey'],
    queries: [
      'sea view',
      'coastal town',
      'sunny street',
      'balcony view',
      'travel mood',
      'open road',
      'train window',
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
      'grey water',
    ],
  },
];

const SCENE_BUCKETS = {
  environment: ['street', 'beach', 'library', 'room', 'interior', 'garden', 'market', 'park', 'town', 'space', 'scene', 'water', 'road', 'view', 'corner'],
  closeup: ['coffee', 'flowers', 'perfume', 'jewelry', 'tea', 'books', 'camera', 'boots', 'fruit', 'brunch', 'pen', 'lamp', 'shoes'],
  texture: ['linen', 'lace', 'silk', 'satin', 'blanket', 'shadows', 'grain', 'fabric', 'paper', 'light', 'glow', 'colors'],
  object: ['postcard', 'postcards', 'record', 'passport', 'suitcase', 'balloons', 'lights', 'desk', 'window', 'table', 'signs', 'objects', 'ribbon'],
};

const STYLE_PROFILES = {
  warm: {
    cues: ['warm', 'golden', 'sunlit', 'amber', 'honey', 'candle', 'cozy', 'wood', 'glow'],
    paletteHints: ['#e6b54a', '#c89868', '#e87a4d'],
    warmth: 0.78,
    brightness: 0.66,
    softness: 0.56,
  },
  soft: {
    cues: ['soft', 'gentle', 'quiet', 'linen', 'calm', 'minimal', 'neutral', 'sheer', 'subtle'],
    paletteHints: ['#e8e0d5', '#f0ebe2', '#e7f3ec'],
    warmth: 0.56,
    brightness: 0.8,
    softness: 0.82,
  },
  pastel: {
    cues: ['pastel', 'powder', 'blush', 'lavender', 'dreamy', 'pink', 'blue', 'mint', 'rose'],
    paletteHints: ['#b693d8', '#edf0f7', '#f7eded'],
    warmth: 0.58,
    brightness: 0.84,
    softness: 0.9,
  },
  moody: {
    cues: ['moody', 'dark', 'night', 'shadow', 'smoke', 'gritty', 'flash', 'neon', 'blue hour'],
    paletteHints: ['#2c2c2c', '#1a1714', '#6c8ec9'],
    warmth: 0.34,
    brightness: 0.28,
    softness: 0.34,
  },
  earthy: {
    cues: ['vintage', 'paper', 'dusty', 'retro', 'clay', 'stone', 'autumn', 'sepia', 'film'],
    paletteHints: ['#8b6e4e', '#c4a882', '#c89868'],
    warmth: 0.68,
    brightness: 0.52,
    softness: 0.48,
  },
};

const STOCK_TERMS = [
  'business', 'office', 'corporate', 'team', 'meeting', 'presentation', 'laptop',
  'headshot', 'portrait', 'isolated', 'studio background', 'copy space', 'template',
  'product mockup', 'advertising', 'marketing', 'handshake', 'smiling camera',
];
const LOW_QUALITY_TERMS = ['blurry', 'pixelated', 'low resolution', 'out of focus', 'grainy screenshot'];
const LIGHTING_CUES = {
  warm: ['warm', 'golden', 'sunlit', 'sunny', 'candle', 'amber', 'glow'],
  soft: ['soft', 'diffused', 'misty', 'gentle', 'sheer', 'calm', 'quiet'],
  dark: ['dark', 'night', 'shadow', 'moody', 'flash', 'neon', 'blue hour'],
};
const VARIETY_ALLOWANCE = 0.14;

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

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const hexToRgb = (hex) => {
  const normalized = String(hex || '').replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHsl = ({ r, g, b }) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
    case gn: h = (bn - rn) / d + 2; break;
    default: h = (rn - gn) / d + 4; break;
  }
  h /= 6;
  return { h, s, l };
};

const getPaletteProfile = (palette = []) => {
  const tones = palette
    .map(hexToRgb)
    .filter(Boolean)
    .map(rgbToHsl);
  if (!tones.length) return { warmth: 0.58, brightness: 0.62, softness: 0.56 };
  const avg = tones.reduce((acc, tone) => ({
    h: acc.h + tone.h,
    s: acc.s + tone.s,
    l: acc.l + tone.l,
  }), { h: 0, s: 0, l: 0 });
  const count = tones.length;
  const hue = avg.h / count;
  return {
    warmth: clamp(1 - Math.min(Math.abs(hue - 0.08), Math.abs(hue - 1.08)) / 0.5, 0, 1),
    brightness: clamp(avg.l / count),
    softness: clamp(1 - ((avg.s / count) * 0.7)),
  };
};

const getPhotoTone = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return { warmth: 0.5, brightness: 0.5, softness: 0.5 };
  const { h, s, l } = rgbToHsl(rgb);
  return {
    warmth: clamp(1 - Math.min(Math.abs(h - 0.08), Math.abs(h - 1.08)) / 0.5, 0, 1),
    brightness: clamp(l),
    softness: clamp(1 - (s * 0.75)),
  };
};

const scoreCueMatches = (text, cues = []) => cues.reduce(
  (score, cue) => (text.includes(cue) ? score + 1 : score),
  0
);

const inferDominantStyle = (prompt, keywords = [], palette = []) => {
  const normalized = sanitizePhrase([prompt, ...keywords].join(' '));
  const paletteProfile = getPaletteProfile(palette);
  let bestKey = 'soft';
  let bestScore = -Infinity;

  Object.entries(STYLE_PROFILES).forEach(([key, profile]) => {
    const cueScore = scoreCueMatches(normalized, profile.cues) * 2.2;
    const paletteHintScore = profile.paletteHints.reduce((score, hint) => {
      const target = getPhotoTone(hint);
      const distance = (
        Math.abs(target.warmth - paletteProfile.warmth) +
        Math.abs(target.brightness - paletteProfile.brightness) +
        Math.abs(target.softness - paletteProfile.softness)
      ) / 3;
      return score + (1 - distance);
    }, 0) / Math.max(1, profile.paletteHints.length);
    const tonalFit = 1 - (
      Math.abs(profile.warmth - paletteProfile.warmth) +
      Math.abs(profile.brightness - paletteProfile.brightness) +
      Math.abs(profile.softness - paletteProfile.softness)
    ) / 3;
    const total = cueScore + paletteHintScore + tonalFit;
    if (total > bestScore) {
      bestScore = total;
      bestKey = key;
    }
  });

  return { key: bestKey, profile: STYLE_PROFILES[bestKey], paletteProfile };
};

const getImageSearchText = (image) => sanitizePhrase([
  image.keyword,
  image.alt,
  image.description,
  image.photographer,
  image.tags,
].join(' '));

const scoreImageQuality = (image) => {
  const text = getImageSearchText(image);
  const stockPenalty = scoreCueMatches(text, STOCK_TERMS) * 0.22;
  const lowQualityPenalty = scoreCueMatches(text, LOW_QUALITY_TERMS) * 0.25;
  const aspectPenalty = image.width && image.height && image.width / image.height < 1.1 ? 0.08 : 0;
  const dimensionPenalty = image.width < 900 || image.height < 650 ? 0.18 : 0;
  const engagementBoost = clamp((image.likes || 0) / 1500, 0, 0.12);
  return clamp(0.95 - stockPenalty - lowQualityPenalty - aspectPenalty - dimensionPenalty + engagementBoost, 0, 1);
};

const scoreLightingToneFit = (image, styleProfile, paletteProfile) => {
  const tone = getPhotoTone(image.color);
  const text = getImageSearchText(image);
  const lightingWarm = scoreCueMatches(text, LIGHTING_CUES.warm);
  const lightingSoft = scoreCueMatches(text, LIGHTING_CUES.soft);
  const lightingDark = scoreCueMatches(text, LIGHTING_CUES.dark);
  const toneWarmth = clamp((tone.warmth + clamp(lightingWarm * 0.12)) - clamp(lightingDark * 0.08));
  const toneSoftness = clamp((tone.softness + clamp(lightingSoft * 0.12)) - clamp(lightingDark * 0.06));
  const toneBrightness = clamp((tone.brightness + clamp(lightingWarm * 0.05)) - clamp(lightingDark * 0.08));
  const target = styleProfile || paletteProfile;
  return {
    tone,
    score: clamp(1 - (
      Math.abs(target.warmth - toneWarmth) +
      Math.abs(target.brightness - toneBrightness) +
      Math.abs(target.softness - toneSoftness)
    ) / 3, 0, 1),
  };
};

const scoreStyleFit = (image, styleKey, styleProfile) => {
  const text = getImageSearchText(image);
  const ownMatches = scoreCueMatches(text, styleProfile.cues);
  const mismatchPenalty = Object.entries(STYLE_PROFILES).reduce((penalty, [key, profile]) => {
    if (key === styleKey) return penalty;
    const hits = scoreCueMatches(text, profile.cues);
    return penalty + (hits > ownMatches ? 0.1 : 0);
  }, 0);
  return clamp((ownMatches / Math.max(2, styleProfile.cues.length * 0.18)) - mismatchPenalty, 0, 1);
};

const dedupeImages = (images) => {
  const seenIds = new Set();
  const seenKeys = new Set();
  const seenVisualSignatures = new Set();

  return images.filter((image) => {
    if (!image?.id || seenIds.has(image.id)) return false;
    const visualKey = sanitizePhrase([
      image.photographer,
      image.alt,
      image.description,
      image.keyword.split(' ').slice(0, 3).join(' '),
    ].join(' '));
    const tonalKey = `${image.bucket}|${String(image.color || '').toLowerCase()}|${sanitizePhrase(image.keyword)}`;
    if (seenKeys.has(visualKey) || seenVisualSignatures.has(tonalKey)) return false;
    seenIds.add(image.id);
    seenKeys.add(visualKey);
    seenVisualSignatures.add(tonalKey);
    return true;
  });
};

const enrichAndFilterImages = (images, prompt, keywords, palette) => {
  const { key: dominantStyle, profile: styleProfile, paletteProfile } = inferDominantStyle(prompt, keywords, palette);

  const curated = dedupeImages(images)
    .map((image) => {
      const quality = scoreImageQuality(image);
      const lightingTone = scoreLightingToneFit(image, styleProfile, paletteProfile);
      const styleFit = scoreStyleFit(image, dominantStyle, styleProfile);
      const bucketBonus = image.bucket === classifyQuery(image.keyword) ? 0.05 : 0;
      const cohesion = clamp((quality * 0.34) + (lightingTone.score * 0.38) + (styleFit * 0.23) + bucketBonus, 0, 1);
      const variance = clamp(Math.abs(lightingTone.score - styleFit), 0, 1);
      return {
        ...image,
        quality,
        tone: lightingTone.tone,
        lightingToneScore: lightingTone.score,
        styleFit,
        cohesion,
        variance,
        dominantStyle,
      };
    })
    .filter((image) => image.quality >= 0.42 && image.cohesion >= 0.36);

  return { dominantStyle, styleProfile, paletteProfile, curated };
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

const toShortQuery = (phrase) => {
  const words = sanitizePhrase(phrase)
    .split(' ')
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .slice(0, 3);
  return words.join(' ');
};

const buildPromptQueries = (prompt) => {
  const normalized = sanitizePhrase(prompt);
  const phrases = [];

  if (normalized.includes('cafe') || normalized.includes('coffee')) {
    phrases.push('linen coffee', 'warm cafe', 'soft table');
  }
  if (normalized.includes('sunday') || normalized.includes('morning')) {
    phrases.push('soft morning', 'warm light');
  }
  if (normalized.includes('beach') || normalized.includes('sea') || normalized.includes('ocean')) {
    phrases.push('sea view', 'coastal light', 'beach shadows');
  }
  if (normalized.includes('city')) {
    phrases.push('city night', 'urban street', 'glass reflections');
  }
  if (normalized.includes('home') || normalized.includes('bedroom')) {
    phrases.push('quiet room', 'linen room', 'soft interior');
  }
  if (normalized.includes('rain') || normalized.includes('rainy')) {
    phrases.push('rainy window', 'wet street', 'grey light');
  }

  const words = pickWords(prompt);
  if (words.length >= 2) {
    phrases.push(toShortQuery(words.slice(0, 2).join(' ')));
  }

  return uniq(phrases.map(toShortQuery)).filter((phrase) => {
    const count = phrase.split(' ').filter(Boolean).length;
    return count >= 2 && count <= 3;
  });
};

const buildVisualSearchQueries = (prompt, vibeKeywords = []) => {
  const mapped = collectMappedQueries(prompt);
  const promptBased = buildPromptQueries(prompt);
  const aiKeywords = uniq(vibeKeywords.map(toShortQuery))
    .filter((phrase) => {
      const count = phrase.split(' ').filter(Boolean).length;
      return count >= 2 && count <= 3;
    })
    .slice(0, 4);

  const combined = uniq([...mapped, ...promptBased, ...aiKeywords]).filter((phrase) => {
    const words = sanitizePhrase(phrase).split(' ').filter(Boolean);
    return words.length >= 2 && words.length <= 3;
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
    if (selected.length >= 10) return;
    const bucket = classifyQuery(phrase);
    if (!usedBuckets.has(bucket) || selected.length < 4) {
      selected.push(phrase);
      usedBuckets.add(bucket);
      return;
    }
    if (!selected.includes(phrase)) selected.push(phrase);
  });

  return selected.slice(0, Math.max(6, Math.min(10, selected.length)));
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
  "keywords": ["6-10 short aesthetic search queries, 2-3 words each, e.g. rainy window, soft light, vintage room"],
  "palette": ["5 hex color codes matching the mood"],
  "decorations": ["5 items from: stars, hearts, bows, flowers, arrows, sparkles, stamps, lemons, ribbons, moons, clouds, leaves, film, coffee"]
}

Rules:
- keywords must be 2-3 words each
- keywords must feel visual, aesthetic, and reusable across many images
- do not use full sentences or highly specific locations
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
    description: sanitizePhrase(photo.description || photo.alt_description || ''),
    color: photo.color || '',
    width: Number(photo.width || 0),
    height: Number(photo.height || 0),
    likes: Number(photo.likes || 0),
    tags: Array.isArray(photo.tags) ? photo.tags.map((tag) => tag?.title).filter(Boolean).join(' ') : '',
  }));
};

const curateImages = (images, prompt, keywords, palette, limit = 8) => {
  const { curated } = enrichAndFilterImages(images, prompt, keywords, palette);
  const buckets = ['environment', 'closeup', 'texture', 'object'];
  const selected = [];
  const cohesiveTarget = Math.max(1, Math.round(limit * 0.8));
  const exploratoryTarget = Math.max(1, limit - cohesiveTarget);
  const cohesivePool = curated
    .filter((image) => image.variance <= VARIETY_ALLOWANCE)
    .sort((a, b) => b.cohesion - a.cohesion);
  const variedPool = curated
    .filter((image) => image.variance > VARIETY_ALLOWANCE && image.variance <= VARIETY_ALLOWANCE + 0.18)
    .sort((a, b) => b.cohesion - a.cohesion);
  const fallbackPool = curated
    .filter((image) => !cohesivePool.includes(image) && !variedPool.includes(image))
    .sort((a, b) => b.cohesion - a.cohesion);

  buckets.forEach((bucket) => {
    const match = cohesivePool.find((image) => image.bucket === bucket && !selected.includes(image))
      || variedPool.find((image) => image.bucket === bucket && !selected.includes(image))
      || fallbackPool.find((image) => image.bucket === bucket && !selected.includes(image));
    if (match) selected.push(match);
  });

  cohesivePool.forEach((image) => {
    if (selected.length >= cohesiveTarget) return;
    if (!selected.includes(image)) selected.push(image);
  });

  variedPool.forEach((image) => {
    if (selected.length >= cohesiveTarget + exploratoryTarget) return;
    if (!selected.includes(image)) selected.push(image);
  });

  fallbackPool.forEach((image) => {
    if (selected.length < limit && !selected.includes(image)) selected.push(image);
  });

  cohesivePool.forEach((image) => {
    if (selected.length < limit && !selected.includes(image)) selected.push(image);
  });

  return selected.slice(0, limit);
};

const fetchAllImages = async (keywords, prompt, palette) => {
  if (!process.env.UNSPLASH_ACCESS_KEY) return [];
  const settled = await Promise.allSettled(
    keywords.slice(0, 8).map((kw) => fetchUnsplashForKeyword(kw))
  );
  const images = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  return curateImages(images, prompt, keywords, palette, 8);
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
  const palette = Array.isArray(vibe.palette) ? vibe.palette.filter(Boolean) : [];
  const images = await fetchAllImages(keywords, prompt, palette);

  return res.json({
    success: true,
    data: {
      vibeTitle: String(vibe.vibeTitle || 'My Moodboard').trim(),
      vibeDescription: String(vibe.vibeDescription || '').trim(),
      keywords,
      palette: palette.length ? palette.slice(0, 5) : ['#e8e0d5', '#c4a882', '#2c2c2c', '#8b6e4e', '#f0ebe2'],
      decorations: Array.isArray(vibe.decorations) ? vibe.decorations.slice(0, 5) : ['stars', 'hearts'],
      images,
    },
  });
});
