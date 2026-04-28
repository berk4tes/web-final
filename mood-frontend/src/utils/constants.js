// Shared constants — moods, content types, color tokens for vibe interpretation
export const MOODS = [
  { value: 'happy', label: 'Happy', color: 'bg-mood-happy', ring: 'ring-mood-happy' },
  { value: 'sad', label: 'Sad', color: 'bg-mood-sad', ring: 'ring-mood-sad' },
  { value: 'excited', label: 'Excited', color: 'bg-mood-excited', ring: 'ring-mood-excited' },
  { value: 'calm', label: 'Calm', color: 'bg-mood-calm', ring: 'ring-mood-calm' },
  { value: 'angry', label: 'Intense', color: 'bg-mood-angry', ring: 'ring-mood-angry' },
  { value: 'nostalgic', label: 'Nostalgic', color: 'bg-mood-nostalgic', ring: 'ring-mood-nostalgic' },
  { value: 'tired', label: 'Tired', color: 'bg-mood-tired', ring: 'ring-mood-tired' },
];

export const CONTENT_TYPES = [
  { value: 'movie', label: 'Film' },
  { value: 'series', label: 'Series' },
  { value: 'music', label: 'Music' },
  { value: 'book', label: 'Book' },
];

export const MOOD_BY_VALUE = Object.fromEntries(MOODS.map((m) => [m.value, m]));

export const MOOD_HEX = {
  happy: '#e6b54a',
  sad: '#6c8ec9',
  excited: '#e87a4d',
  calm: '#6dbb8a',
  angry: '#d96762',
  nostalgic: '#c89868',
  tired: '#9ca3af',
};

// Vibe color palette — used by the prompt-based vibe interpretation flow.
// Each entry maps to a colorKey returned by the backend mood interpretation.
export const VIBE_COLORS = {
  calm: {
    label: 'Calm',
    accent: '#6dbb8a',
    soft: '#e7f3ec',
    ink: '#2f5a3e',
    gradient: 'from-emerald-200 via-teal-200 to-emerald-100',
    ring: 'ring-emerald-300',
  },
  sad: {
    label: 'Melancholic',
    accent: '#6c8ec9',
    soft: '#e3eaf6',
    ink: '#2c4267',
    gradient: 'from-sky-200 via-indigo-200 to-blue-100',
    ring: 'ring-sky-300',
  },
  nostalgic: {
    label: 'Nostalgic',
    accent: '#c89868',
    soft: '#f4ead9',
    ink: '#74522d',
    gradient: 'from-amber-200 via-orange-200 to-rose-100',
    ring: 'ring-amber-300',
  },
  angry: {
    label: 'Intense',
    accent: '#d96762',
    soft: '#f7e0de',
    ink: '#7a2d2a',
    gradient: 'from-rose-200 via-red-200 to-orange-200',
    ring: 'ring-rose-300',
  },
  dreamy: {
    label: 'Dreamy',
    accent: '#b693d8',
    soft: '#efe7f7',
    ink: '#5a3d83',
    gradient: 'from-violet-200 via-fuchsia-200 to-pink-100',
    ring: 'ring-violet-300',
  },
  happy: {
    label: 'Sunlit',
    accent: '#e6b54a',
    soft: '#faf0d4',
    ink: '#7a5916',
    gradient: 'from-yellow-200 via-amber-200 to-orange-100',
    ring: 'ring-amber-300',
  },
  excited: {
    label: 'Electric',
    accent: '#e87a4d',
    soft: '#fae0d3',
    ink: '#8a3a17',
    gradient: 'from-orange-300 via-rose-200 to-pink-200',
    ring: 'ring-orange-300',
  },
};

export const VIBE_PROMPT_EXAMPLES = [
  'Feels like Gilmore Girls in autumn',
  'Sad but peaceful late-night drive',
  'Dark feminine gym energy',
  'A sunlit Sunday in a Parisian café',
  'Heartbreak sleeping under string lights',
  'Cozy attic during a thunderstorm',
];

// Mood-responsive prompt suggestions — shown after a vibe is interpreted.
export const MOOD_PROMPT_SUGGESTIONS = {
  calm: [
    'A quiet afternoon with herbal tea',
    'Soft fog over mountains at dawn',
    'Reading beside an open window',
    'A gentle walk through a botanical garden',
  ],
  sad: [
    'A letter you never sent',
    'Empty cafes in winter rain',
    'The last song before goodbye',
    'Standing alone at the ocean\'s edge',
  ],
  nostalgic: [
    'Feels like Gilmore Girls in autumn',
    'Dusty photographs from childhood summers',
    'The smell of your grandparents\' kitchen',
    'Polaroids from a summer you can\'t forget',
  ],
  happy: [
    'A sunlit Sunday in a Parisian café',
    'Dancing barefoot in the backyard',
    'Strawberries and laughter at golden hour',
    'The first warm day after a long winter',
  ],
  excited: [
    'Dark feminine gym energy',
    'Electric city nights before a big show',
    'Pre-concert adrenaline',
    'Racing into something new',
  ],
  angry: [
    'Controlled chaos and raw intensity',
    'A storm that finally breaks open',
    'Fierce, unapologetic, and loud',
    'Running until the frustration fades',
  ],
  dreamy: [
    'Heartbreak sleeping under string lights',
    'Cozy attic during a thunderstorm',
    'Lost in a foreign city at midnight',
    'Lavender fields slowly fading to dusk',
  ],
};

export const getVibeColor = (key) => VIBE_COLORS[key] || VIBE_COLORS.calm;

export const getPromptSuggestions = (colorKey) =>
  MOOD_PROMPT_SUGGESTIONS[colorKey] || VIBE_PROMPT_EXAMPLES.slice(0, 4);
