import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getVibeColor } from '../utils/constants';
import { readUserScopedJson } from '../utils/userStorage';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const RECENT_MOODS_KEY = 'moodflix.recentMoods';

const MOOD_LOOKS = {
  calm: {
    title: 'Soft focus',
    trTitle: 'Yumuşak odak',
    words: ['linen', 'quiet green', 'slow morning', 'clean air'],
    quotes: {
      en: ['Take the gentle route.', 'Let the day breathe.', 'Soft is still strong.'],
      tr: ['Yumuşak olan da güçlüdür.', 'Bugün biraz alan aç.', 'Sakinlik de bir yön.'],
    },
    images: [
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    ],
  },
  sad: {
    title: 'Blue hour',
    trTitle: 'Mavi saat',
    words: ['rain glass', 'empty seats', 'soft ache', 'midnight window'],
    quotes: {
      en: ['Feel it, then move lightly.', 'A quiet reset counts.', 'You can be tender and continue.'],
      tr: ['Hisset, sonra hafifle.', 'Sessiz reset de sayılır.', 'Kırılgan olup devam edebilirsin.'],
    },
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    ],
  },
  nostalgic: {
    title: 'Old money autumn',
    trTitle: 'Eski sonbahar',
    words: ['burgundy', 'paper texture', 'old letters', 'gold lamp'],
    quotes: {
      en: ['Romanticize the ritual.', 'Keep the memory, choose the next page.', 'Make it timeless.'],
      tr: ['Ritüeli güzelleştir.', 'Anıyı tut, sonraki sayfayı seç.', 'Zamansız yap.'],
    },
    images: [
      'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    ],
  },
  angry: {
    title: 'High contrast',
    trTitle: 'Keskin kontrast',
    words: ['red velvet', 'chrome', 'sharp light', 'black coffee'],
    quotes: {
      en: ['Use the fire with precision.', 'Power, but polished.', 'Choose the clean edge.'],
      tr: ['Ateşi net kullan.', 'Güçlü ama rafine.', 'Keskin kenarı seç.'],
    },
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    ],
  },
  dreamy: {
    title: 'Moonlit collage',
    trTitle: 'Ay ışığı kolajı',
    words: ['lavender haze', 'silk shadow', 'blurred city', 'stars'],
    quotes: {
      en: ['Dream, then design it.', 'Keep the strange sparkle.', 'The soft vision is still a plan.'],
      tr: ['Hayal et, sonra tasarla.', 'Garip parıltıyı koru.', 'Yumuşak vizyon da plandır.'],
    },
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=900&q=80',
    ],
  },
  happy: {
    title: 'Sunlit editorial',
    trTitle: 'Güneşli editorial',
    words: ['citrus', 'gold hour', 'open window', 'fresh flowers'],
    quotes: {
      en: ['Follow the bright signal.', 'Let it be easy today.', 'Make room for delight.'],
      tr: ['Parlak sinyali takip et.', 'Bugün kolay aksın.', 'Keyfe yer aç.'],
    },
    images: [
      'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    ],
  },
  excited: {
    title: 'Electric night',
    trTitle: 'Elektrik gece',
    words: ['neon', 'afterparty', 'fast pulse', 'mirror flash'],
    quotes: {
      en: ['Move before you overthink.', 'Keep the pulse clean.', 'Start loud, finish sharp.'],
      tr: ['Fazla düşünmeden başla.', 'Ritmi temiz tut.', 'Gür başla, net bitir.'],
    },
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    ],
  },
};

const DraggableSticker = ({ children, className = '', initial }) => {
  const [position, setPosition] = useState(initial);

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = position;

    const handleMove = (moveEvent) => {
      setPosition({
        x: startPosition.x + moveEvent.clientX - startX,
        y: startPosition.y + moveEvent.clientY - startY,
      });
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <button
      type="button"
      className={`moodboard-sticker ${className}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      onPointerDown={handlePointerDown}
    >
      {children}
    </button>
  );
};

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
  const moodKey = sourceMood?.colorKey || 'dreamy';
  const color = getVibeColor(moodKey);
  const look = MOOD_LOOKS[moodKey] || MOOD_LOOKS.dreamy;
  const title = sourceMood?.title || (tr ? look.trTitle : look.title);
  const quoteSet = look.quotes[tr ? 'tr' : 'en'];

  if (!hasMood) {
    return (
      <div
        className="moodboard-page moodboard-gate"
        style={{ '--board-accent': color.accent, '--board-soft': color.soft, '--board-ink': color.ink }}
      >
        <section className="moodboard-gate-card">
          <span>{tr ? 'Moodboard hazır değil' : 'Moodboard needs a mood'}</span>
          <h1>{tr ? 'Önce bir mood gir.' : 'Enter a mood first.'}</h1>
          <p>
            {tr
              ? 'Yeni girişte eski oturum moodunu kullanmıyorum; board senin son moodundan üretilecek.'
              : 'For a fresh login, the board waits for your own latest mood instead of reusing an old session.'}
          </p>
          <Link to="/vibe">{tr ? 'Mood gir' : 'Add mood'}</Link>
        </section>
      </div>
    );
  }

  return (
    <div
      className="moodboard-page"
      style={{ '--board-accent': color.accent, '--board-soft': color.soft, '--board-ink': color.ink }}
    >
      <section className="moodboard-cover">
        <img src={look.images[0]} alt="" />
        <div>
          <span>{tr ? 'visual moodboard' : 'visual moodboard'}</span>
          <h1>{title}</h1>
          <p>{look.words.join(' / ')}</p>
        </div>
      </section>

      <section className="moodboard-workbench" aria-label="Visual moodboard">
        <div className="moodboard-visual-grid">
          {look.images.concat(look.images.slice(1, 3)).map((image, index) => (
            <figure key={`${image}-${index}`} className={index % 4 === 0 ? 'wide' : index % 3 === 0 ? 'tall' : ''}>
              <img src={image} alt="" loading="lazy" />
            </figure>
          ))}
        </div>

        <DraggableSticker initial={{ x: 28, y: 34 }} className="is-quote">
          {quoteSet[0]}
        </DraggableSticker>
        <DraggableSticker initial={{ x: 280, y: 132 }} className="is-word">
          {look.words[0]}
        </DraggableSticker>
        <DraggableSticker initial={{ x: 520, y: 62 }} className="is-quote">
          {quoteSet[1]}
        </DraggableSticker>
        <DraggableSticker initial={{ x: 150, y: 390 }} className="is-word">
          {look.words[2]}
        </DraggableSticker>
        <DraggableSticker initial={{ x: 610, y: 420 }} className="is-quote">
          {quoteSet[2]}
        </DraggableSticker>
      </section>
    </div>
  );
};

export default MoodboardPage;
