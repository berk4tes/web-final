// Shared constants — mood metadata and content type definitions
export const MOODS = [
  { value: 'happy', label: 'Mutlu', emoji: '😊', color: 'bg-mood-happy', ring: 'ring-mood-happy' },
  { value: 'sad', label: 'Üzgün', emoji: '😢', color: 'bg-mood-sad', ring: 'ring-mood-sad' },
  { value: 'excited', label: 'Heyecanlı', emoji: '🤩', color: 'bg-mood-excited', ring: 'ring-mood-excited' },
  { value: 'calm', label: 'Sakin', emoji: '😌', color: 'bg-mood-calm', ring: 'ring-mood-calm' },
  { value: 'angry', label: 'Kızgın', emoji: '😠', color: 'bg-mood-angry', ring: 'ring-mood-angry' },
  { value: 'nostalgic', label: 'Nostaljik', emoji: '🥺', color: 'bg-mood-nostalgic', ring: 'ring-mood-nostalgic' },
  { value: 'tired', label: 'Yorgun', emoji: '😴', color: 'bg-mood-tired', ring: 'ring-mood-tired' },
];

export const CONTENT_TYPES = [
  { value: 'movie', label: 'Film', icon: '🎬' },
  { value: 'series', label: 'Dizi', icon: '📺' },
  { value: 'music', label: 'Müzik', icon: '🎵' },
];

export const MOOD_BY_VALUE = Object.fromEntries(MOODS.map((m) => [m.value, m]));

export const MOOD_HEX = {
  happy: '#facc15',
  sad: '#3b82f6',
  excited: '#fb923c',
  calm: '#14b8a6',
  angry: '#ef4444',
  nostalgic: '#a855f7',
  tired: '#9ca3af',
};
