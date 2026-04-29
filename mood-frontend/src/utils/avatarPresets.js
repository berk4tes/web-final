export const AVATAR_PRESETS = [
  {
    id: 'sunset',
    name: 'Sunset',
    bg: 'linear-gradient(135deg, #ff8a5b, #f4d35e)',
    face: '#fff7df',
    accent: '#7c3f2b',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: 'linear-gradient(135deg, #3a2a8a, #6c8ec9)',
    face: '#e9e3ff',
    accent: '#ffffff',
  },
  {
    id: 'matcha',
    name: 'Matcha',
    bg: 'linear-gradient(135deg, #6dbb8a, #d9f99d)',
    face: '#f8fff4',
    accent: '#2f6b44',
  },
  {
    id: 'rose',
    name: 'Rose',
    bg: 'linear-gradient(135deg, #f0a6ca, #f9dcc4)',
    face: '#fff5f8',
    accent: '#9f456b',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bg: 'linear-gradient(135deg, #38bdf8, #2dd4bf)',
    face: '#effcff',
    accent: '#075985',
  },
  {
    id: 'mono',
    name: 'Mono',
    bg: 'linear-gradient(135deg, #1f1d18, #7a7565)',
    face: '#f8f7f4',
    accent: '#f4d35e',
  },
];

export const getAvatarPreset = (value) => {
  if (!value?.startsWith('preset:')) return null;
  const id = value.replace('preset:', '');
  return AVATAR_PRESETS.find((preset) => preset.id === id) || null;
};
