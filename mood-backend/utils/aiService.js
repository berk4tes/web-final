// aiService — OpenAI-powered mood-based content recommendations
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

Suggest exactly 6 ${contentType} items that match this mood.
Return ONLY a valid JSON object with a "recommendations" array. Example format:
{
  "recommendations": [
    {
      "title": "exact title for TMDB/Spotify/OpenLibrary search",
      "reason": "1-2 sentence explanation of why this matches the mood",
      "genre": "primary genre"
    }
  ]
}`;
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

module.exports = { generateRecommendations };
