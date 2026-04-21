// claudeService — wraps Anthropic SDK calls for mood-based content recommendations
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

const buildPrompt = (moodLabel, moodText, intensity, contentType) => {
  return `You are a mood-based entertainment recommender.
The user's current mood: "${moodLabel}" (intensity: ${intensity}/10).
Additional context: "${moodText || 'None provided'}"
Content type requested: ${contentType}

Suggest exactly 6 ${contentType} items that match this mood.
Return ONLY a valid JSON array, no markdown, no explanation outside the array:
[
  {
    "title": "exact title for TMDB/Spotify search",
    "reason": "1-2 sentence explanation of why this matches the mood",
    "genre": "primary genre"
  }
]`;
};

const extractJsonArray = (text) => {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new Error('No JSON array found in Claude response');
  }
  const jsonStr = cleaned.slice(start, end + 1);
  return JSON.parse(jsonStr);
};

const callClaude = async (prompt) => {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  return extractJsonArray(text);
};

const generateRecommendations = async (moodLabel, moodText, intensity, contentType) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const prompt = buildPrompt(moodLabel, moodText, intensity, contentType);

  try {
    const result = await callClaude(prompt);
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Claude returned empty or invalid array');
    }
    return result;
  } catch (firstError) {
    console.warn('Claude first attempt failed, retrying once:', firstError.message);
    try {
      const result = await callClaude(prompt);
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Claude returned empty array on retry');
      }
      return result;
    } catch (retryError) {
      throw new Error(`Claude API failed after retry: ${retryError.message}`);
    }
  }
};

module.exports = { generateRecommendations };
