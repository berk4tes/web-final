export const MOOD_KEYWORDS = {
  calm: [
    'calm',
    'peaceful',
    'quiet',
    'soft',
    'gentle',
    'serene',
    'cozy',
    'rahat',
    'sakin',
    'huzurlu',
    'yumusak',
  ],
  sad: [
    'sad',
    'blue',
    'lonely',
    'melancholy',
    'heartbreak',
    'rain',
    'empty',
    'uzgun',
    'melankolik',
    'yalniz',
    'huzun',
  ],
  nostalgic: [
    'autumn',
    'fall',
    'nostalgic',
    'memory',
    'childhood',
    'vintage',
    'old photos',
    'sonbahar',
    'nostaljik',
    'ani',
    'gecmis',
  ],
  happy: [
    'happy',
    'sunny',
    'bright',
    'joy',
    'laugh',
    'golden',
    'summer',
    'paris',
    'parisian',
    'cafe',
    'mutlu',
    'neseli',
    'gunesli',
    'umutlu',
  ],
  excited: [
    'excited',
    'electric',
    'party',
    'adrenaline',
    'fast',
    'gym',
    'bold',
    'energetic',
    'enerjik',
    'heyecanli',
    'hareketli',
  ],
  angry: [
    'angry',
    'rage',
    'storm',
    'chaos',
    'intense',
    'dark',
    'revenge',
    'kizgin',
    'ofkeli',
    'sert',
    'karanlik',
  ],
  romantic: [
    'love',
    'romance',
    'romantic love',
    'crush',
    'passion',
    'valentine',
    'heart',
    'rose',
    'red roses',
    'ask',
    'aşk',
    'sevgi',
    'sevgili',
    'romantik ask',
    'tutku',
    'kalp',
    'kirmizi gul',
    'kırmızı gül',
  ],
  dreamy: [
    'dream',
    'dreamy',
    'ethereal',
    'moon',
    'lavender',
    'surreal',
    'fog',
    'romantic',
    'ruya',
    'romantik',
    'sisli',
    'buyulu',
  ],
};

const normalize = (value) =>
  value
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const inferMoodKeyFromText = (text = '') => {
  const normalized = normalize(text);
  if (normalized.trim().length < 2) return null;

  let best = null;
  let bestScore = 0;

  for (const [moodKey, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const score = keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalize(keyword);
      return normalized.includes(normalizedKeyword) ? total + normalizedKeyword.length : total;
    }, 0);

    if (score > bestScore) {
      best = moodKey;
      bestScore = score;
    }
  }

  return best;
};
