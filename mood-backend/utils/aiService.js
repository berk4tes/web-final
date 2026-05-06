// aiService — OpenAI-powered mood interpretation and recommendations
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'gpt-4o-mini';

const buildPrompt = (moodLabel, moodText, intensity, contentType) => {
  return `You are a mood-based entertainment recommender.
The user's current mood: "${moodLabel}" (intensity: ${intensity}/10).
Additional context: "${moodText || 'None provided'}"
Content type requested: ${contentType}

Suggest exactly 10 ${contentType} items that match this mood.
Return ONLY a valid JSON object with a "recommendations" array. Example format:
{
  "recommendations": [
    {
      "title": "exact title for TMDB/Spotify/OpenLibrary search",
      "artist": "for music only — primary artist name",
      "reason": "1-2 sentence explanation of why this matches the mood",
      "genre": "primary genre"
    }
  ]
}`;
};

const buildVibePrompt = (prompt) => {
  return `You are a sophisticated mood interpretation engine for an entertainment discovery app.

User input prompt: "${prompt}"

Analyze the mood/vibe of this prompt deeply, then generate recommendations across three media types.

Return ONLY a JSON object with this EXACT shape:
{
  "mood": {
    "title": "a poetic 2-4 word title that captures the vibe",
    "summary": "one short sentence (max 18 words) describing the emotional atmosphere",
    "tags": ["tag1", "tag2", "tag3", "tag4"],
    "intensity": 0.65,
    "colorKey": "calm | sad | nostalgic | angry | romantic | dreamy | happy | excited | cinematic | fresh"
  },
  "music": [
    { "title": "exact song title", "artist": "primary artist", "reason": "why it fits", "genre": "primary genre" }
  ],
  "movies": [
    { "title": "exact movie/series title", "contentType": "movie | series", "reason": "why it fits", "genre": "primary genre" }
  ],
  "books": [
    { "title": "exact book title", "reason": "why it fits", "genre": "primary genre" }
  ]
}

Rules:
- "intensity" is a number between 0 and 1 representing emotional strength
- "colorKey" must be one of: calm, sad, nostalgic, angry, romantic, dreamy, happy, excited, cinematic, fresh
- Use "romantic" for love, aşk, crush, passion, red roses, date-night, heart-forward prompts instead of "happy"
- Use "cinematic" for movie-like, dramatic, noir, neon, film-grain prompts when no stronger emotion dominates
- Use "fresh" for clean, new-start, airy, ocean, spring-rain prompts
- "tags" must be 3-5 short words/phrases describing the vibe
- "music" must contain EXACTLY 12 items so the interface can keep 10 visible after saves
- "movies" must contain EXACTLY 12 items: the first 10 visible picks must be exactly 5 movies and 5 series, followed by 2 backup picks
- "books" must contain EXACTLY 12 items so the interface can keep 10 visible after read marks
- Every movie item must include "contentType" as either "movie" or "series"
- Use real, well-known titles that exist on TMDB / Open Library / Spotify
- Keep "reason" under 20 words and emotionally evocative`;
};

const extractRecommendations = (text) => {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.recommendations)) return parsed.recommendations;
  if (Array.isArray(parsed.items)) return parsed.items;
  if (Array.isArray(parsed.results)) return parsed.results;
  throw new Error('No recommendations array in AI response');
};

const callAI = async (prompt) => {
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    max_tokens: 1024,
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful entertainment recommendation assistant that always responds with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = response.choices[0]?.message?.content || '';
  return extractRecommendations(text);
};

const callAIRaw = async (prompt, { maxTokens = 2048, temperature = 0.85 } = {}) => {
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
    temperature,
    messages: [
      {
        role: 'system',
        content:
          'You are a poetic entertainment curation engine. Respond ONLY with valid JSON exactly matching the requested schema.',
      },
      { role: 'user', content: prompt },
    ],
  });
  const text = response.choices[0]?.message?.content || '';
  return JSON.parse(text);
};

const generateRecommendations = async (moodLabel, moodText, intensity, contentType) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const prompt = buildPrompt(moodLabel, moodText, intensity, contentType);

  try {
    const result = await callAI(prompt);
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('AI returned empty or invalid array');
    }
    return result;
  } catch (firstError) {
    console.warn('AI first attempt failed, retrying once:', firstError.message);
    try {
      const result = await callAI(prompt);
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('AI returned empty array on retry');
      }
      return result;
    } catch (retryError) {
      throw new Error(`AI API failed after retry: ${retryError.message}`);
    }
  }
};

const VALID_COLOR_KEYS = ['calm', 'sad', 'nostalgic', 'angry', 'romantic', 'dreamy', 'happy', 'excited', 'cinematic', 'fresh'];

const normalizePrompt = (value = '') =>
  value
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const PROMPT_COLOR_RULES = [
  { colorKey: 'romantic', words: ['love', 'romance', 'crush', 'passion', 'valentine', 'heart', 'rose', 'red roses', 'ask', 'aşk', 'sevgi', 'sevgili', 'tutku', 'kalp', 'kirmizi gul', 'kırmızı gül'] },
  { colorKey: 'cinematic', words: ['cinematic', 'movie', 'film grain', 'noir', 'neon', 'widescreen', 'dramatic', 'sinema', 'film gibi'] },
  { colorKey: 'fresh', words: ['fresh', 'clean', 'new start', 'ocean', 'spring rain', 'air', 'deniz', 'ferah', 'temiz', 'yeni baslangic', 'yeni başlangıç'] },
];

const inferColorKeyFromPrompt = (prompt = '') => {
  const normalized = normalizePrompt(prompt);
  let best = null;
  let bestScore = 0;
  for (const rule of PROMPT_COLOR_RULES) {
    const score = rule.words.reduce((total, word) => (
      normalized.includes(normalizePrompt(word)) ? total + normalizePrompt(word).length : total
    ), 0);
    if (score > bestScore) {
      best = rule.colorKey;
      bestScore = score;
    }
  }
  return best;
};

const orderMoviePicks = (items = []) => {
  const normalized = items.map((item) => ({
    ...item,
    contentType: item?.contentType === 'series' || item?.type === 'series' || item?.mediaType === 'series'
      ? 'series'
      : 'movie',
  }));
  const movies = normalized.filter((item) => item.contentType === 'movie');
  const series = normalized.filter((item) => item.contentType === 'series');
  const leading = [...movies.slice(0, 5), ...series.slice(0, 5)];
  const used = new Set(leading);
  return [
    ...leading,
    ...normalized.filter((item) => !used.has(item)),
  ].slice(0, 12);
};

const sanitizeVibe = (raw, prompt = '') => {
  const mood = raw.mood || {};
  const intensity = Number(mood.intensity);
  const promptColorKey = inferColorKeyFromPrompt(prompt);
  const colorKey = promptColorKey || (VALID_COLOR_KEYS.includes(mood.colorKey) ? mood.colorKey : 'calm');
  return {
    mood: {
      title: String(mood.title || 'A Quiet Vibe').trim(),
      summary: String(mood.summary || '').trim(),
      tags: Array.isArray(mood.tags) ? mood.tags.slice(0, 6).map(String) : [],
      intensity: Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 0.5,
      colorKey,
    },
    music: Array.isArray(raw.music) ? raw.music.slice(0, 12) : [],
    movies: Array.isArray(raw.movies) ? orderMoviePicks(raw.movies) : [],
    books: Array.isArray(raw.books) ? raw.books.slice(0, 12) : [],
  };
};

const interpretVibe = async (prompt) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  if (!prompt || prompt.trim().length < 3) {
    throw new Error('Prompt must be at least 3 characters');
  }

  const builtPrompt = buildVibePrompt(prompt.trim());

  try {
    const raw = await callAIRaw(builtPrompt, { maxTokens: 5500 });
    return sanitizeVibe(raw, prompt);
  } catch (firstError) {
    console.warn('Vibe interpretation failed, retrying:', firstError.message);
    const raw = await callAIRaw(builtPrompt, { maxTokens: 5500 });
    return sanitizeVibe(raw, prompt);
  }
};

module.exports = { generateRecommendations, interpretVibe };
