import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getVibeColor } from '../utils/constants';
import { readUserScopedJson } from '../utils/userStorage';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const RECENT_MOODS_KEY = 'moodflix.recentMoods';

const LAB_OPTIONS = {
  look: {
    en: 'Look',
    tr: 'Stil',
    items: [
      { id: 'gloss', en: 'glossy jacket', tr: 'parlak ceket' },
      { id: 'library', en: 'library layers', tr: 'kütüphane katmanları' },
      { id: 'soft', en: 'soft uniform', tr: 'soft uniform' },
    ],
  },
  sound: {
    en: 'Sound',
    tr: 'Ses',
    items: [
      { id: 'bass', en: 'late bass', tr: 'gece bası' },
      { id: 'vinyl', en: 'vinyl crackle', tr: 'plak çıtırtısı' },
      { id: 'dream', en: 'dream pop', tr: 'dream pop' },
    ],
  },
  ritual: {
    en: 'Ritual',
    tr: 'Ritüel',
    items: [
      { id: 'coffee', en: 'iced coffee walk', tr: 'buzlu kahve yürüyüşü' },
      { id: 'notes', en: 'notes app diary', tr: 'notlar günlüğü' },
      { id: 'room', en: 'room reset', tr: 'oda reseti' },
    ],
  },
};

const MOOD_RECIPES = {
  calm: {
    tr: ['Sakin ama cool', 'temiz masa', 'matcha tonu', 'az bildirim'],
    en: ['quiet but cool', 'clean desk', 'matcha tint', 'low notifications'],
  },
  sad: {
    tr: ['melankolik edit', 'yağmur camı', 'gümüş aksesuar', 'soft fade'],
    en: ['melancholy edit', 'rain glass', 'silver detail', 'soft fade'],
  },
  nostalgic: {
    tr: ['dark academia', 'eski kitap', 'kahve izi', 'film grain'],
    en: ['dark academia', 'old book', 'coffee mark', 'film grain'],
  },
  angry: {
    tr: ['kırmızı enerji', 'keskin eyeliner', 'chrome detay', 'net cevap'],
    en: ['red energy', 'sharp liner', 'chrome detail', 'clean answer'],
  },
  dreamy: {
    tr: ['ay ışığı kolajı', 'disco yansıması', 'lavanta haze', 'şehir bulanıklığı'],
    en: ['moonlit collage', 'disco reflection', 'lavender haze', 'city blur'],
  },
  happy: {
    tr: ['dopamin günü', 'çiçek pazarı', 'cherry ton', 'parlak plan'],
    en: ['dopamine day', 'flower market', 'cherry tint', 'bright plan'],
  },
  excited: {
    tr: ['neon pre-game', 'flash foto', 'platform bot', 'hızlı akış'],
    en: ['neon pre-game', 'flash photo', 'platform boots', 'fast pulse'],
  },
};

const pickMoodKey = (mood) => mood?.colorKey || 'dreamy';

const MoodboardPage = () => {
  const { user } = useAuth();
  const userId = user?._id;
  const { prefs } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const savedVibes = useMemo(() => {
    const stored = readUserScopedJson(SAVED_VIBES_KEY, userId, []);
    return Array.isArray(stored) ? stored : [];
  }, [userId]);
  const recentMoods = useMemo(() => {
    const stored = readUserScopedJson(RECENT_MOODS_KEY, userId, []);
    return Array.isArray(stored) ? stored : [];
  }, [userId]);
  const sourceMood = recentMoods[0]?.mood || savedVibes[0]?.mood;
  const hasMood = Boolean(sourceMood);
  const moodKey = pickMoodKey(sourceMood);
  const color = getVibeColor(moodKey);
  const recipe = MOOD_RECIPES[moodKey] || MOOD_RECIPES.dreamy;
  const moodTitle = sourceMood?.title || recipe[tr ? 'tr' : 'en'][0];
  const [choices, setChoices] = useState({ look: 'gloss', sound: 'dream', ritual: 'coffee' });

  const selectedText = Object.entries(choices).map(([group, id]) => {
    const item = LAB_OPTIONS[group].items.find((option) => option.id === id);
    return item?.[tr ? 'tr' : 'en'];
  }).filter(Boolean);

  const handleCopy = async () => {
    const text = `${moodTitle}: ${selectedText.join(' + ')}. ${recipe[tr ? 'tr' : 'en'].join(', ')}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(tr ? 'Vibe reçetesi kopyalandı' : 'Vibe recipe copied');
    } catch {
      toast.error(tr ? 'Kopyalanamadı' : 'Could not copy');
    }
  };

  const handleShuffle = () => {
    const next = {};
    Object.entries(LAB_OPTIONS).forEach(([key, group]) => {
      next[key] = group.items[Math.floor(Math.random() * group.items.length)].id;
    });
    setChoices(next);
  };

  if (!hasMood) {
    return (
      <div className="vibe-lab-page vibe-lab-gate" style={{ '--lab-accent': color.accent, '--lab-soft': color.soft, '--lab-ink': color.ink }}>
        <section className="vibe-lab-empty">
          <span>{tr ? 'Vibe Lab bekliyor' : 'Vibe Lab is waiting'}</span>
          <h1>{tr ? 'Önce bir vibe üret.' : 'Create a vibe first.'}</h1>
          <Link to="/vibe">{tr ? 'Vibe sayfasına git' : 'Go to Vibe'}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="vibe-lab-page" style={{ '--lab-accent': color.accent, '--lab-soft': color.soft, '--lab-ink': color.ink }}>
      <section className="vibe-lab-hero">
        <div>
          <span>{tr ? 'Vibe Lab' : 'Vibe Lab'}</span>
          <h1>{tr ? 'Bugünün estetik reçetesi' : 'Today’s aesthetic recipe'}</h1>
        </div>
        <div className="vibe-lab-capsule" aria-hidden>
          <i />
          <i />
          <i />
        </div>
      </section>

      <section className="vibe-lab-grid">
        <div className="vibe-lab-console">
          {Object.entries(LAB_OPTIONS).map(([key, group]) => (
            <div key={key} className="vibe-lab-group">
              <span>{group[tr ? 'tr' : 'en']}</span>
              <div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={choices[key] === item.id ? 'is-selected' : ''}
                    onClick={() => setChoices((current) => ({ ...current, [key]: item.id }))}
                  >
                    {item[tr ? 'tr' : 'en']}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="vibe-lab-result">
          <span>{moodTitle}</span>
          <h2>{selectedText.join(' + ')}</h2>
          <div className="vibe-lab-visuals" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <div className="vibe-lab-tags">
            {recipe[tr ? 'tr' : 'en'].map((item) => <em key={item}>{item}</em>)}
          </div>
          <div className="vibe-lab-actions">
            <button type="button" onClick={handleShuffle}>{tr ? 'Karıştır' : 'Shuffle'}</button>
            <button type="button" onClick={handleCopy}>{tr ? 'Reçeteyi kopyala' : 'Copy recipe'}</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MoodboardPage;
