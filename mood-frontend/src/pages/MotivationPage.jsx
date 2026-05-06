import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../context/UserPreferencesContext';
import api from '../services/api';
import { getVibeColor } from '../utils/constants';
import { readUserScopedJson, writeUserScopedJson } from '../utils/userStorage';

const GAME_KEY = 'luma.gameState';
const SAVED_VIBES_KEY = 'luma.savedVibes';
const WATCHED_KEY = 'luma.watched';
const READ_KEY = 'luma.readBooks';
const SEASONAL_PROGRESS_KEY = 'luma.seasonalProgress';

const MOODS = [
  { id: 'happy', emoji: '😊', label: { en: 'Bright', tr: 'Parlak' }, room: 'Sunlit Watch Room' },
  { id: 'calm', emoji: '😌', label: { en: 'Calm', tr: 'Sakin' }, room: 'Soft Focus Room' },
  { id: 'dreamy', emoji: '🌙', label: { en: 'Dreamy', tr: 'Dalgın' }, room: 'Dreamy Night Room' },
  { id: 'nostalgic', emoji: '🍂', label: { en: 'Nostalgic', tr: 'Nostaljik' }, room: 'Autumn Rewatch Room' },
  { id: 'intense', emoji: '🔥', label: { en: 'Intense', tr: 'Yoğun' }, room: 'High Drama Room' },
];

const DAILY_TASKS = [
  {
    id: 'checkin',
    xp: 50,
    label: { en: 'Drop today’s mood signal', tr: 'Bugünün mood sinyalini bırak' },
    hint: { en: 'Adds your feeling to the room pulse.', tr: 'Hissini oda akışına ekler.' },
  },
  {
    id: 'seasonalWatch',
    xp: 80,
    label: { en: 'Watch one seasonal film or series', tr: 'Bir sezon filmi/dizisi izle' },
    hint: { en: 'Done when you mark a room movie or series watched.', tr: 'Oda listesinden film/dizi izledim deyince tamamlanır.' },
  },
  {
    id: 'seasonalListen',
    xp: 60,
    label: { en: 'Listen to one seasonal track', tr: 'Bir sezon şarkısı dinle' },
    hint: { en: 'Done when you mark a Spring track listened.', tr: 'Sezon şarkısını dinledim deyince tamamlanır.' },
  },
  {
    id: 'seasonalRead',
    xp: 70,
    label: { en: 'Read one seasonal book', tr: 'Bir sezon kitabı oku' },
    hint: { en: 'Done when you mark a room book read.', tr: 'Oda kitabını okudum deyince tamamlanır.' },
  },
  {
    id: 'emotionNote',
    xp: 60,
    label: { en: 'Pair an emotion with a title', tr: 'Bir içerikle duygu eşleştir' },
    hint: { en: '“I felt calm while watching this.”', tr: '“Bunu izlerken sakin hissettim.”' },
  },
  {
    id: 'save',
    xp: 40,
    label: { en: 'Save a vibe to your archive', tr: 'Arşivine bir vibe kaydet' },
    hint: { en: 'Keep one recommendation for later.', tr: 'Bir öneriyi sonrası için sakla.' },
  },
];

const REVIEW_EMOTIONS = [
  { id: 'bright', label: { en: 'Bright', tr: 'Parlak' } },
  { id: 'calm', label: { en: 'Calm', tr: 'Sakin' } },
  { id: 'romantic', label: { en: 'Romantic', tr: 'Romantik' } },
  { id: 'nostalgic', label: { en: 'Nostalgic', tr: 'Nostaljik' } },
  { id: 'energized', label: { en: 'Energized', tr: 'Canlı' } },
];

const SEASON_ROOMS = {
  spring: {
    title: { en: 'Spring Rewatch Room', tr: 'İlkbahar Rewatch Odası' },
    subtitle: { en: 'First warm nights, soft rain, fresh-start stories.', tr: 'İlk sıcak akşamlar, hafif yağmur, yeni başlangıç hikayeleri.' },
    cue: { en: 'Now open: spring rewatches', tr: 'Şimdi açık: ilkbahar rewatch' },
    shelves: {
      movies: ['Before Sunrise', 'Pride & Prejudice', 'Little Women', 'Past Lives', 'Notting Hill', 'Emma', 'Frances Ha', 'The Half of It', 'Gilmore Girls', 'Anne with an E', 'Heartstopper', 'Daisy Jones & The Six'],
      reads: ['The Secret Garden', 'Normal People', 'A Room with a View', 'Anne of Green Gables', 'Emma', 'Writers & Lovers', 'Book Lovers', 'I Capture the Castle', 'The Enchanted April', 'Persuasion', 'The Blue Castle', 'Convenience Store Woman'],
      music: ['Spring Day', 'Sweet Disposition', 'Bloom', 'April Come She Will', 'Strawberries & Cigarettes', 'There She Goes', 'First Day of My Life', 'Put Your Records On', 'Dreams', 'Sunflower', 'Garden Song', 'Lover'],
    },
  },
  summer: {
    title: { en: 'Summer Night Room', tr: 'Yaz Gecesi Odası' },
    subtitle: { en: 'Late drives, open windows, high-glow discoveries.', tr: 'Gece yolları, açık camlar, parlak keşifler.' },
    cue: { en: 'Now open: summer heat picks', tr: 'Şimdi açık: yaz sıcaklığı seçimleri' },
    shelves: {
      movies: ['Mamma Mia!', 'Call Me by Your Name', 'The Parent Trap', 'Moonrise Kingdom', 'The Talented Mr. Ripley', 'Before Sunset', 'Aftersun', 'The Way Way Back', 'Outer Banks', 'The Summer I Turned Pretty', 'Looking for Alaska', 'High Fidelity'],
      reads: ['Malibu Rising', 'Beach Read', 'Daisy Jones & The Six', 'The Summer Book', 'Happy Place', 'The Vacationers', 'Every Summer After', 'The Paper Palace', 'Bonjour Tristesse', 'Call Me by Your Name', 'Open Water', 'Just Kids'],
      music: ['Golden Hour', 'Cruel Summer', 'Sunflower', 'Heat Waves', 'Ribs', 'Good Days', 'Sweet Life', 'Summertime Sadness', 'Slide', 'Walking on a Dream', 'Electric Feel', 'Island in the Sun'],
    },
  },
  autumn: {
    title: { en: 'Autumn Rewatch Room', tr: 'Sonbahar Rewatch Odası' },
    subtitle: { en: 'Campus walks, old letters, coffee-colored nostalgia.', tr: 'Kampüs yürüyüşleri, eski mektuplar, kahve tonlu nostalji.' },
    cue: { en: 'Now open: autumn comfort rewatches', tr: 'Şimdi açık: sonbahar konfor rewatch' },
    shelves: {
      movies: ['When Harry Met Sally', 'Dead Poets Society', 'Fantastic Mr. Fox', 'You’ve Got Mail', 'Good Will Hunting', 'Mona Lisa Smile', 'Practical Magic', 'October Sky', 'Gilmore Girls', 'Over the Garden Wall', 'Only Murders in the Building', 'Fleabag'],
      reads: ['If We Were Villains', 'The Secret History', 'Jane Eyre', 'Norwegian Wood', 'Rebecca', 'Babel', 'The Goldfinch', 'Ninth House', 'The Night Circus', 'A Little Life', 'The Bell Jar', 'Wuthering Heights'],
      music: ['Cardigan', 'Autumn Leaves', 'There She Goes', 'Cherry Wine', 'Roslyn', 'Stick Season', 'Motion Sickness', 'Harvest Moon', 'Sweater Weather', 'All Too Well', 'Pink Moon', 'Landslide'],
    },
  },
  winter: {
    title: { en: 'Winter Slow Room', tr: 'Kış Slow Odası' },
    subtitle: { en: 'Quiet rooms, deep focus, stories that stay warm.', tr: 'Sessiz odalar, derin odak, sıcak kalan hikayeler.' },
    cue: { en: 'Now open: winter slow watches', tr: 'Şimdi açık: yavaş kış seçkisi' },
    shelves: {
      movies: ['Carol', 'Little Women', 'The Holiday', 'The Grand Budapest Hotel', 'Eternal Sunshine of the Spotless Mind', 'About Time', 'Klaus', 'The Holdovers', 'Dash & Lily', 'Normal People', 'The Queen’s Gambit', 'Sherlock'],
      reads: ['A Little Life', 'The Snow Child', 'Wintering', 'Wuthering Heights', 'The Bear and the Nightingale', 'The Left Hand of Darkness', 'The Remains of the Day', 'Frankenstein', 'The Little Prince', 'The Midnight Library', 'The Catcher in the Rye', 'Villette'],
      music: ['Mystery of Love', 'River', 'Holocene', 'No Surprises', 'White Winter Hymnal', 're: Stacks', 'Fourth of July', 'The Night We Met', 'Skinny Love', 'Vienna', 'Fade Into You', 'To Build a Home'],
    },
  },
};

const LEVELS = [
  { min: 0, title: 'Mood Hunter', trTitle: 'Mood Avcısı' },
  { min: 250, title: 'Vibe Scout', trTitle: 'Vibe Kaşifi' },
  { min: 600, title: 'Mood Curator', trTitle: 'Mood Küratörü' },
  { min: 1000, title: 'Vibe Maestro', trTitle: 'Vibe Maestro' },
  { min: 1600, title: 'Cinematic Oracle', trTitle: 'Sinematik Kahin' },
];

const localDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTitle = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const uniqueList = (items = []) => [...new Set(items.filter(Boolean))];

const EMPTY_GAME_STATE = { xp: 0, checkins: [], tasksByDay: {} };

const readGameState = (userId) => {
  const stored = readUserScopedJson(GAME_KEY, userId, {});
  return {
    xp: stored.xp || 0,
    checkins: Array.isArray(stored.checkins) ? stored.checkins : [],
    tasksByDay: stored.tasksByDay || {},
  };
};

const getLevel = (xp) => {
  const current = [...LEVELS].reverse().find((level) => xp >= level.min) || LEVELS[0];
  const next = LEVELS.find((level) => level.min > xp);
  const span = next ? next.min - current.min : 500;
  const progress = next ? Math.min(100, Math.round(((xp - current.min) / span) * 100)) : 100;
  return { current, next, progress };
};

const calculateStreak = (checkins) => {
  const days = new Set(checkins.map((item) => item.date));
  let streak = 0;
  const cursor = new Date();
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const moodColorKey = (moodId) => (moodId === 'intense' ? 'angry' : moodId);
const moodApiLabel = (moodId) => {
  if (moodId === 'dreamy') return 'calm';
  if (moodId === 'intense') return 'angry';
  return moodId;
};

const moodIdFromApiLabel = (label) => {
  if (label === 'angry') return 'intense';
  if (label === 'sad') return 'dreamy';
  return label;
};

const getSeasonKey = (date = new Date()) => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

const seasonColorKey = (seasonKey) => ({
  spring: 'calm',
  summer: 'happy',
  autumn: 'nostalgic',
  winter: 'sad',
}[seasonKey] || 'calm');

const seasonName = (seasonKey, tr) => ({
  spring: tr ? 'İlkbahar' : 'Spring',
  summer: tr ? 'Yaz' : 'Summer',
  autumn: tr ? 'Sonbahar' : 'Autumn',
  winter: tr ? 'Kış' : 'Winter',
}[seasonKey] || (tr ? 'Sezon' : 'Season'));

const contentTypeLabel = (type, tr) => ({
  movie: tr ? 'film' : 'movie',
  series: tr ? 'dizi' : 'series',
  music: tr ? 'müzik' : 'track',
  book: tr ? 'kitap' : 'book',
}[type] || (tr ? 'içerik' : 'title'));

const SERIES_TITLES = new Set([
  'Gilmore Girls',
  'Anne with an E',
  'Heartstopper',
  'Daisy Jones & The Six',
  'Outer Banks',
  'The Summer I Turned Pretty',
  'Looking for Alaska',
  'High Fidelity',
  'Over the Garden Wall',
  'Only Murders in the Building',
  'Fleabag',
  'Dash & Lily',
  'Normal People',
  'The Queen’s Gambit',
  'Sherlock',
]);

const readJsonArray = (key, userId) => {
  const items = readUserScopedJson(key, userId, []);
  return Array.isArray(items) ? items : [];
};

const readSeasonalProgress = (userId) => {
  const progress = readUserScopedJson(SEASONAL_PROGRESS_KEY, userId, {});
  return progress && typeof progress === 'object' ? progress : {};
};

const writeSeasonalProgress = (userId, progress) => {
  writeUserScopedJson(SEASONAL_PROGRESS_KEY, userId, progress);
};

const getSeasonItemKey = (seasonKey, shelf, title) => `${seasonKey}:${shelf}:${title}`;

const getSeasonContentType = (shelf, title) => {
  if (shelf === 'movies') return SERIES_TITLES.has(title) ? 'series' : 'movie';
  if (shelf === 'reads') return 'book';
  return 'music';
};

const seasonalCoverCache = new Map();

const getOpenLibraryCover = async (title) => {
  const query = encodeURIComponent(title);
  const res = await fetch(`https://openlibrary.org/search.json?title=${query}&limit=1`);
  const data = await res.json();
  const coverId = data?.docs?.[0]?.cover_i;
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : '';
};

const getSeasonalCover = async (draft) => {
  if (!draft?.title) return '';
  const cacheKey = `${draft.contentType}:${draft.title}`;
  if (seasonalCoverCache.has(cacheKey)) return seasonalCoverCache.get(cacheKey);
  let cover = '';
  if (draft.contentType === 'movie' || draft.contentType === 'series') {
    const { data } = await api.get('/recommendations/tmdb/details', {
      params: { title: draft.title, contentType: draft.contentType },
    });
    cover = data?.data?.details?.poster || '';
    seasonalCoverCache.set(cacheKey, cover);
    return cover;
  }
  if (draft.contentType === 'book') {
    try {
      const query = encodeURIComponent(draft.title);
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&printType=books`);
      const data = await res.json();
      const imageLinks = data?.items?.[0]?.volumeInfo?.imageLinks || {};
      cover = (imageLinks.thumbnail || imageLinks.smallThumbnail || '').replace(/^http:/, 'https:');
    } catch {
      cover = '';
    }
    if (!cover) cover = await getOpenLibraryCover(draft.title);
    seasonalCoverCache.set(cacheKey, cover);
    return cover;
  }
  if (draft.contentType === 'music') {
    const query = encodeURIComponent(draft.title);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`);
    const data = await res.json();
    cover = (data?.results?.[0]?.artworkUrl100 || '').replace('100x100bb', '600x600bb');
    seasonalCoverCache.set(cacheKey, cover);
    return cover;
  }
  return '';
};

const MedalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2h8l-2 7h-4L8 2z" />
    <circle cx="12" cy="15" r="5" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3 2.7 5.48 6.05.88-4.38 4.27 1.03 6.02L12 16.8l-5.4 2.85 1.03-6.02-4.38-4.27 6.05-.88L12 3z" />
  </svg>
);

const SpringReviewModal = ({
  draft,
  rating,
  emotion,
  language,
  saving,
  onClose,
  onRating,
  onEmotion,
  onSave,
}) => {
  const [coverUrl, setCoverUrl] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    let active = true;
    setCoverUrl('');
    setHoverRating(0);
    if (!draft) return () => { active = false; };
    getSeasonalCover(draft)
      .then((url) => {
        if (active) setCoverUrl(url || '');
      })
      .catch(() => {
        if (active) setCoverUrl('');
      });
    return () => { active = false; };
  }, [draft]);

  if (!draft) return null;
  const tr = language === 'tr';
  const previewRating = hoverRating || rating;
  const typeLabel = draft.shelf === 'music'
    ? (tr ? 'müzik' : 'music')
    : draft.shelf === 'reads'
      ? (tr ? 'kitap' : 'book')
      : (tr ? 'film/dizi' : 'film/series');

  return (
    <div className="spring-review-backdrop" role="dialog" aria-modal="true">
      <div className="spring-review-modal">
        <button
          type="button"
          className="spring-review-close"
          onClick={onClose}
          aria-label={tr ? 'Kapat' : 'Close'}
        />
        <div className="spring-review-poster" data-kind={draft.shelf}>
          {coverUrl ? <img src={coverUrl} alt={draft.title} /> : null}
          <span>{typeLabel}</span>
          <strong>{draft.title}</strong>
          <em>{tr ? 'Sezon challenge' : 'Spring challenge'}</em>
        </div>
        <div className="spring-review-copy">
          <span>{tr ? 'Tamamlandı' : 'Completed'}</span>
          <h2>{tr ? 'Nasıl hissettirdi?' : 'How did it land?'}</h2>
          <p>
            {tr
              ? 'Puanını ve baskın duygunu seç; challenge kaydın backend’e yazılsın.'
              : 'Pick a rating and the strongest emotion; your challenge note will be saved to the backend.'}
          </p>
          <div className="spring-review-stars" aria-label={tr ? 'Puan' : 'Rating'}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                onFocus={() => setHoverRating(value)}
                onBlur={() => setHoverRating(0)}
                className={[
                  value <= rating ? 'is-filled' : '',
                  hoverRating && value <= previewRating && value > rating ? 'is-preview' : '',
                ].filter(Boolean).join(' ')}
                aria-label={`${value}/5`}
              >
                <StarIcon filled={value <= previewRating} />
              </button>
            ))}
          </div>
          <div className="spring-review-emotions">
            {REVIEW_EMOTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onEmotion(item.id)}
                className={emotion === item.id ? 'is-selected' : ''}
              >
                {item.label[language]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="spring-review-save"
            onClick={onSave}
            disabled={saving || !rating || !emotion}
          >
            {saving ? (tr ? 'Kaydediliyor...' : 'Saving...') : (tr ? 'Kaydet' : 'Save reflection')}
          </button>
        </div>
      </div>
    </div>
  );
};

const SeasonalShelfItem = ({
  title,
  index,
  seasonKey,
  shelf,
  done,
  review,
  language,
  onSelect,
}) => {
  const [coverUrl, setCoverUrl] = useState('');
  const tr = language === 'tr';
  const contentType = getSeasonContentType(shelf, title);
  const reviewEmotionLabel = REVIEW_EMOTIONS.find((item) => item.id === review?.emotion)?.label?.[language];
  const rateLabel = shelf === 'movies'
    ? (tr ? 'izledim, puanla' : 'rate watched')
    : shelf === 'reads'
      ? (tr ? 'okudum, puanla' : 'rate read')
      : (tr ? 'dinledim, puanla' : 'rate listened');
  const actionLabel = done
    ? (review ? (tr ? 'puanlandı' : 'rated') : rateLabel)
    : shelf === 'movies'
      ? (tr ? 'izledim' : 'mark watched')
      : shelf === 'reads'
        ? (tr ? 'okudum' : 'mark read')
        : (tr ? 'dinledim' : 'mark listened');

  useEffect(() => {
    let active = true;
    setCoverUrl('');
    getSeasonalCover({ seasonKey, shelf, title, contentType })
      .then((url) => {
        if (active) setCoverUrl(url || '');
      })
      .catch(() => {
        if (active) setCoverUrl('');
      });
    return () => { active = false; };
  }, [contentType, seasonKey, shelf, title]);

  return (
    <button
      type="button"
      onClick={() => onSelect(shelf, title)}
      className={done ? 'is-picked' : ''}
    >
      <span className="mot-v3-shelf-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="mot-v3-shelf-cover">
        {coverUrl ? <img src={coverUrl} alt="" loading="lazy" /> : <i>{title.slice(0, 1)}</i>}
      </span>
      <strong>{title}</strong>
      {review ? (
        <small>
          {'★'.repeat(review.rating)}
          {reviewEmotionLabel ? ` · ${reviewEmotionLabel}` : ''}
        </small>
      ) : null}
      <em>{actionLabel}</em>
    </button>
  );
};

const MotivationPage = () => {
  const { user } = useAuth();
  const { prefs, t } = useUserPreferences();
  const userId = user?._id;
  const tr = prefs.language === 'tr';
  const today = localDateKey();
  const seasonKey = useMemo(() => getSeasonKey(), []);
  const seasonRoom = SEASON_ROOMS[seasonKey];
  const [game, setGame] = useState(() => readGameState(userId));
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activeShelf, setActiveShelf] = useState('movies');
  const [roomPick, setRoomPick] = useState('');
  const [seasonalProgress, setSeasonalProgress] = useState(() => readSeasonalProgress(userId));
  const [savedVibes, setSavedVibes] = useState(() => readJsonArray(SAVED_VIBES_KEY, userId));
  const [collectionItems, setCollectionItems] = useState({ watched: [], reads: [], music: [] });
  const [moodLogCheckins, setMoodLogCheckins] = useState([]);
  const [remoteStreak, setRemoteStreak] = useState(0);
  const [reviewDraft, setReviewDraft] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewEmotion, setReviewEmotion] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  const loadSummary = async () => {
    try {
      const { data } = await api.get('/motivation/summary');
      setSummary(data.data);
    } catch (err) {
      console.warn('Motivation summary failed:', err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadCollections = async () => {
    const watchedItems = readJsonArray(WATCHED_KEY, userId);
    const readItems = readJsonArray(READ_KEY, userId);
    let musicItems = [];
    try {
      const { data } = await api.get('/favorites', { params: { limit: 100 } });
      musicItems = (Array.isArray(data?.data?.items) ? data.data.items : [])
        .filter((item) => item.contentType === 'music');
    } catch {
      musicItems = [];
    }
    setCollectionItems({ watched: watchedItems, reads: readItems, music: musicItems });
  };

  const loadMoodSignals = async () => {
    try {
      const [streakResult, historyResult] = await Promise.allSettled([
        api.get('/stats/streak'),
        api.get('/moods/history', { params: { limit: 80 } }),
      ]);
      if (streakResult.status === 'fulfilled') {
        setRemoteStreak(Number(streakResult.value?.data?.data?.streak) || 0);
      }
      if (historyResult.status === 'fulfilled') {
        const rows = historyResult.value?.data?.data?.items || [];
        setMoodLogCheckins(rows.map((item) => ({
          date: localDateKey(item.loggedAt || item.createdAt),
          moodId: moodIdFromApiLabel(item.moodLabel),
        })));
      }
    } catch {
      setRemoteStreak(0);
      setMoodLogCheckins([]);
    }
  };

  useEffect(() => {
    setSummaryLoading(true);
    loadSummary();
    loadCollections();
    loadMoodSignals();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    writeUserScopedJson(GAME_KEY, userId, game);
  }, [game, userId]);

  useEffect(() => {
    setGame(readGameState(userId));
    setSeasonalProgress(readSeasonalProgress(userId));
    setSavedVibes(readJsonArray(SAVED_VIBES_KEY, userId));
    loadCollections();
    loadMoodSignals();
    setSummary(null);
    setSummaryLoading(true);
  }, [userId]);

  useEffect(() => {
    const refreshLocalSignals = () => {
      setGame(readGameState(userId));
      setSeasonalProgress(readSeasonalProgress(userId));
      setSavedVibes(readJsonArray(SAVED_VIBES_KEY, userId));
      loadCollections();
      loadMoodSignals();
    };

    window.addEventListener('storage', refreshLocalSignals);
    window.addEventListener('focus', refreshLocalSignals);
    return () => {
      window.removeEventListener('storage', refreshLocalSignals);
      window.removeEventListener('focus', refreshLocalSignals);
    };
  }, [userId]);

  const localTodayCheckin = game.checkins.find((item) => item.date === today);
  const remoteTodayCheckin = moodLogCheckins.find((item) => item.date === today);
  const todayTasks = game.tasksByDay[today] || {};
  const remoteTasksToday = summary?.currentUser?.tasksToday || [];
  const todayCheckin = localTodayCheckin || remoteTodayCheckin;
  const seasonProgress = seasonalProgress[seasonKey] || {};
  const inferShelfProgress = (shelf, items) => {
    const collectionTitles = new Set((items || []).map((item) => normalizeTitle(item.title)));
    const collectionIds = new Set((items || []).map((item) => normalizeTitle(item.externalId)));
    return (seasonRoom.shelves[shelf] || [])
      .filter((title) => {
        const normalized = normalizeTitle(title);
        return collectionTitles.has(normalized) || [...collectionIds].some((id) => id.endsWith(normalized));
      })
      .map((title) => getSeasonItemKey(seasonKey, shelf, title));
  };
  const seasonShelfProgress = {
    movies: uniqueList([...(seasonProgress.movies || []), ...inferShelfProgress('movies', collectionItems.watched)]),
    music: uniqueList([...(seasonProgress.music || []), ...inferShelfProgress('music', collectionItems.music)]),
    reads: uniqueList([...(seasonProgress.reads || []), ...inferShelfProgress('reads', collectionItems.reads)]),
    emotions: seasonProgress.emotions || [],
  };
  const savedToday = savedVibes.some((vibe) => localDateKey(vibe.savedAt) === today);
  const inferredTaskIds = useMemo(() => [
    todayCheckin ? 'checkin' : '',
    seasonShelfProgress.movies.length ? 'seasonalWatch' : '',
    seasonShelfProgress.music.length ? 'seasonalListen' : '',
    seasonShelfProgress.reads.length ? 'seasonalRead' : '',
    seasonShelfProgress.emotions.length ? 'emotionNote' : '',
    savedToday ? 'save' : '',
  ].filter(Boolean), [
    savedToday,
    seasonShelfProgress.emotions.length,
    seasonShelfProgress.movies.length,
    seasonShelfProgress.music.length,
    seasonShelfProgress.reads.length,
    todayCheckin,
  ]);
  const awardedTaskIds = useMemo(() => new Set([
    ...Object.entries(todayTasks).filter(([, done]) => done).map(([id]) => id),
    ...remoteTasksToday,
  ]), [remoteTasksToday, todayTasks]);
  const completedTaskIds = useMemo(() => new Set([
    ...awardedTaskIds,
    ...inferredTaskIds,
  ]), [awardedTaskIds, inferredTaskIds]);

  const streak = Math.max(calculateStreak(game.checkins), calculateStreak(moodLogCheckins), remoteStreak);
  const activeMood = MOODS.find((mood) => mood.id === todayCheckin?.moodId) || MOODS[0];
  const activeColor = getVibeColor(todayCheckin ? moodColorKey(todayCheckin.moodId) : seasonColorKey(seasonKey));
  const totalXp = summary?.currentUser?.xp ?? game.xp;
  const level = getLevel(totalXp);
  const currentLevelTitle = tr ? level.current.trTitle : level.current.title;
  const nextLevelTitle = tr ? level.next?.trTitle : level.next?.title;
  const completedCount = DAILY_TASKS.filter((task) => completedTaskIds.has(task.id)).length;
  const taskProgress = Math.round((completedCount / DAILY_TASKS.length) * 100);
  const nextXp = Math.max(0, level.next ? level.next.min - totalXp : 0);
  const leaderboard = summary?.leaderboard?.length
    ? summary.leaderboard
    : [{ username: user?.username || 'You', xp: game.xp, rank: 1, self: true }];
  const currentRank = leaderboard.find((item) => item.self)?.rank || 1;
  const topRacers = leaderboard.slice(0, 5);
  const moodChat = summary?.moodChat?.length ? summary.moodChat : [{
    id: 'local-chat',
    username: user?.username || 'Idil',
    moodLabel: moodApiLabel(activeMood.id),
    moodText: tr ? 'Spring odasında yeni bir his bıraktı.' : 'left a fresh feeling in the spring room.',
    title: roomPick || seasonRoom.shelves.movies[0],
    contentType: 'movie',
  }];
  const activeShelfItems = activeShelf === 'chat' ? [] : seasonRoom.shelves[activeShelf];
  const reviewByItemKey = useMemo(() => {
    const map = new Map();
    (summary?.currentUser?.springReviews || []).forEach((item) => {
      if (!item?.seasonKey || !item?.shelf || !item?.title) return;
      map.set(getSeasonItemKey(item.seasonKey, item.shelf, item.title), item);
    });
    return map;
  }, [summary?.currentUser?.springReviews]);
  const seasonTotal = seasonRoom.shelves.movies.length + seasonRoom.shelves.music.length + seasonRoom.shelves.reads.length;
  const seasonCompleted = seasonShelfProgress.movies.length + seasonShelfProgress.music.length + seasonShelfProgress.reads.length;
  const badgeRows = [
    {
      id: 'watch',
      label: tr ? `${seasonName(seasonKey, tr)} ekran rozeti` : `${seasonName(seasonKey, tr)} Screen Badge`,
      done: seasonShelfProgress.movies.length >= seasonRoom.shelves.movies.length,
      count: `${seasonShelfProgress.movies.length}/${seasonRoom.shelves.movies.length}`,
    },
    {
      id: 'listen',
      label: tr ? `${seasonName(seasonKey, tr)} ses rozeti` : `${seasonName(seasonKey, tr)} Sound Badge`,
      done: seasonShelfProgress.music.length >= seasonRoom.shelves.music.length,
      count: `${seasonShelfProgress.music.length}/${seasonRoom.shelves.music.length}`,
    },
    {
      id: 'read',
      label: tr ? `${seasonName(seasonKey, tr)} okuma rozeti` : `${seasonName(seasonKey, tr)} Reads Badge`,
      done: seasonShelfProgress.reads.length >= seasonRoom.shelves.reads.length,
      count: `${seasonShelfProgress.reads.length}/${seasonRoom.shelves.reads.length}`,
    },
    {
      id: 'curator',
      label: tr ? 'Sezon küratörü' : 'Season Curator',
      done: seasonCompleted >= seasonTotal,
      count: `${seasonCompleted}/${seasonTotal}`,
    },
  ];

  const markTaskLocal = (task, addXp = false) => {
    setGame((prev) => {
      const dayTasks = prev.tasksByDay[today] || {};
      if (dayTasks[task.id]) return prev;
      return {
        ...prev,
        xp: prev.xp + (addXp ? task.xp : 0),
        tasksByDay: {
          ...prev.tasksByDay,
          [today]: { ...dayTasks, [task.id]: true },
        },
      };
    });
  };

  const saveCollectionToDatabase = (type, entry) => {
    api.post('/collections', {
      type,
      contentType: entry.contentType,
      externalId: entry.externalId,
      title: entry.title,
      thumbnail: entry.thumbnail,
    }).catch((err) => {
      if (err?.response?.status !== 409) {
        toast.error(tr ? 'Koleksiyon database’e yazılamadı' : 'Could not save to database');
      }
    });
  };

  const awardTask = async (task) => {
    if (!task) return false;
    if (awardedTaskIds.has(task.id)) return false;
    try {
      const { data } = await api.post('/motivation/award', { taskId: task.id });
      setSummary((prev) => ({
        ...(prev || {}),
        leaderboard: data.data.leaderboard || prev?.leaderboard || [],
        currentUser: {
          ...(prev?.currentUser || {}),
          ...(data.data.currentUser || {}),
        },
        moodChat: prev?.moodChat || [],
      }));
      markTaskLocal(task, false);
      if (data.data.awarded) toast.success(`+${data.data.xpAwarded} XP`);
      return true;
    } catch (err) {
      console.warn('Motivation award failed:', err.message);
      markTaskLocal(task, true);
      toast.success(`+${task.xp} XP`);
      return false;
    }
  };

  const handleCheckin = async (mood) => {
    if (todayCheckin) {
      setGame((prev) => ({
        ...prev,
        checkins: localTodayCheckin
          ? prev.checkins.map((item) => item.date === today ? { ...item, moodId: mood.id } : item)
          : [{ date: today, moodId: mood.id }, ...prev.checkins].slice(0, 60),
      }));
      toast.success(tr ? 'Bugünün moodu güncellendi' : 'Today’s mood updated');
      return;
    }

    setGame((prev) => ({
      ...prev,
      checkins: [{ date: today, moodId: mood.id }, ...prev.checkins].slice(0, 60),
    }));

    try {
      await api.post('/moods', {
        moodLabel: moodApiLabel(mood.id),
        moodText: tr
          ? `${mood.label.tr} hissi motivation odasına eklendi`
          : `${mood.label.en} feeling added to the motivation room`,
        intensity: 7,
      });
    } catch (err) {
      console.warn('Mood check-in log failed:', err.message);
    }

    await awardTask(DAILY_TASKS[0]);
    loadSummary();
  };

  const handleTaskToggle = (task) => {
    toast(tr
      ? `${task.label.tr} gerçek aksiyonla tamamlanır.`
      : `${task.label.en} completes from the real action.`);
  };

  const handleSeasonalComplete = async (shelf, title) => {
    setRoomPick(title);
    const key = getSeasonItemKey(seasonKey, shelf, title);
    const currentSeason = seasonalProgress[seasonKey] || {};
    const currentShelf = currentSeason[shelf] || [];
    if (currentShelf.includes(key)) {
      const contentType = getSeasonContentType(shelf, title);
      const existingReview = reviewByItemKey.get(key);
      setReviewDraft({ seasonKey, shelf, title, contentType });
      setReviewRating(existingReview?.rating || 0);
      setReviewEmotion(existingReview?.emotion || '');
      return;
    }

    const nextSeason = {
      ...currentSeason,
      [shelf]: [...currentShelf, key],
    };
    const nextProgress = {
      ...seasonalProgress,
      [seasonKey]: nextSeason,
    };
    setSeasonalProgress(nextProgress);
    writeSeasonalProgress(userId, nextProgress);

    if (shelf === 'movies') {
      const contentType = getSeasonContentType(shelf, title);
      const existing = readJsonArray(WATCHED_KEY, userId);
      const entry = {
        externalId: key,
        title,
        thumbnail: '',
        contentType,
        watchedAt: new Date().toISOString(),
      };
      if (!existing.some((item) => (item.externalId || item.title) === entry.externalId)) {
        writeUserScopedJson(WATCHED_KEY, userId, [entry, ...existing].slice(0, 100));
      }
      saveCollectionToDatabase('watched', entry);
      await awardTask(DAILY_TASKS.find((task) => task.id === 'seasonalWatch'));
    }

    if (shelf === 'music') {
      await awardTask(DAILY_TASKS.find((task) => task.id === 'seasonalListen'));
    }

    if (shelf === 'reads') {
      const existing = readJsonArray(READ_KEY, userId);
      const entry = {
        externalId: key,
        title,
        thumbnail: '',
        contentType: 'book',
        readAt: new Date().toISOString(),
      };
      if (!existing.some((item) => (item.externalId || item.title) === entry.externalId)) {
        writeUserScopedJson(READ_KEY, userId, [entry, ...existing].slice(0, 100));
      }
      saveCollectionToDatabase('read', entry);
      await awardTask(DAILY_TASKS.find((task) => task.id === 'seasonalRead'));
    }

    const completedCountForShelf = nextSeason[shelf].length;
    const totalForShelf = seasonRoom.shelves[shelf].length;
    if (completedCountForShelf === totalForShelf) {
      toast.success(tr ? 'Badge kazandın' : 'Badge unlocked');
    }

    const contentType = getSeasonContentType(shelf, title);
    setReviewDraft({ seasonKey, shelf, title, contentType });
    setReviewRating(0);
    setReviewEmotion('');
  };

  const handleEmotionNote = async () => {
    const currentSeason = seasonalProgress[seasonKey] || {};
    const emotions = currentSeason.emotions || [];
    if (!emotions.includes(today)) {
      const nextProgress = {
        ...seasonalProgress,
        [seasonKey]: {
          ...currentSeason,
          emotions: [...emotions, today],
        },
      };
      setSeasonalProgress(nextProgress);
      writeSeasonalProgress(userId, nextProgress);
    }
    await awardTask(DAILY_TASKS.find((task) => task.id === 'emotionNote'));
  };

  const handleSaveReview = async () => {
    if (!reviewDraft || !reviewRating || !reviewEmotion) return;
    setReviewSaving(true);
    try {
      await api.post('/motivation/spring-review', {
        ...reviewDraft,
        rating: reviewRating,
        emotion: reviewEmotion,
      });
      await handleEmotionNote();
      await loadSummary();
      toast.success(tr ? 'Spring kaydın eklendi' : 'Spring reflection saved');
      setReviewDraft(null);
    } catch (err) {
      toast.error(err.response?.data?.message || (tr ? 'Kayıt yapılamadı' : 'Could not save reflection'));
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div
      className="mot-page mot-v3"
      style={{
        '--mot-accent': activeColor.accent,
        '--mot-soft': activeColor.soft,
        '--mot-ink': activeColor.ink,
      }}
    >
      <section className="mot-v3-hero py-4 md:py-5">
        <div className="mot-v3-copy">
          <span>{t('navMotivation')} / {seasonRoom.cue[prefs.language]}</span>
          <h1 className="text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.9]">{seasonRoom.title[prefs.language]}</h1>
          <div className="mot-v3-actions">
            <Link to="/vibe">{tr ? 'Yeni vibe üret' : 'Generate a vibe'}</Link>
          </div>
        </div>

        <div className="mot-v3-rank">
          <span>{tr ? 'global sıra' : 'global rank'}</span>
          <strong>#{currentRank}</strong>
          <em>{totalXp} XP</em>
          <div>
            <i style={{ width: `${level.progress}%` }} />
          </div>
          <small>
            {level.next
              ? `${nextXp} XP ${tr ? 'sonra' : 'to'} ${nextLevelTitle}`
              : tr ? 'En üst seviye açık' : 'Top level unlocked'}
          </small>
        </div>
      </section>

      <section className="mot-v3-race">
        <div className="mot-v3-leaderboard">
          <div className="mot-v3-section-head">
            <span>{tr ? 'Gerçek sıralama' : 'Real leaderboard'}</span>
            <strong>{summaryLoading ? (tr ? 'yükleniyor' : 'loading') : `${leaderboard.length} ${tr ? 'kullanıcı' : 'users'}`}</strong>
          </div>
          <div className="mot-v3-leader-rows">
            {topRacers.map((item) => (
              <div key={item.userId || item.username} className={item.self ? 'is-self' : ''}>
                <span>{item.rank}</span>
                <strong>{item.username || item.name}</strong>
                <em>{item.xp} XP</em>
                <i style={{ width: `${Math.min(100, (item.xp / Math.max(topRacers[0]?.xp || 1, 1)) * 100)}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="mot-v3-checkin">
          <div className="mot-v3-section-head">
            <span>{tr ? 'Bugünün moodu' : 'Today’s mood'}</span>
            <strong>{streak}/7 {tr ? 'seri' : 'streak'}</strong>
          </div>
          <div className="mot-v3-moods">
            {MOODS.map((mood) => {
              const selected = todayCheckin?.moodId === mood.id;
              const color = getVibeColor(moodColorKey(mood.id));
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleCheckin(mood)}
                  className={selected ? 'is-selected' : ''}
                  style={{ '--token-accent': color.accent }}
                >
                  <span>{mood.emoji}</span>
                  <strong>{mood.label[prefs.language]}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mot-v3-quests">
        <div className="mot-v3-section-head">
          <span>{tr ? 'Günlük görevler' : 'Daily quests'}</span>
          <strong>{taskProgress}%</strong>
        </div>
        <div className="mot-v3-quest-grid">
          {DAILY_TASKS.map((task, index) => {
            const done = completedTaskIds.has(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => handleTaskToggle(task)}
                disabled={done}
                className={done ? 'is-done' : ''}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{task.label[prefs.language]}</strong>
                <p>{task.hint[prefs.language]}</p>
                <em>{done ? (tr ? 'tamamlandı' : 'completed') : `+${task.xp} XP`}</em>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mot-v3-room">
        <div className="mot-v3-room-intro">
          <span>{tr ? 'Sezon odası' : 'Seasonal room'}</span>
          <h2>{seasonRoom.title[prefs.language]}</h2>
          <p>{seasonRoom.subtitle[prefs.language]}</p>
          <div className="mot-v3-room-tabs">
            {[
              ['movies', tr ? 'Film & Dizi' : 'Film & Series'],
              ['reads', tr ? `${seasonName(seasonKey, tr)} okumaları` : `${seasonName(seasonKey, tr)} Reads`],
              ['music', tr ? `${seasonName(seasonKey, tr)} müzikleri` : `${seasonName(seasonKey, tr)} Music`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveShelf(key)}
                className={activeShelf === key ? 'is-active' : ''}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeShelf === 'chat' ? (
          <div className="mot-v3-chat">
            {moodChat.slice(0, 6).map((item) => {
              const chatColor = getVibeColor(item.moodLabel);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleEmotionNote}
                  style={{ '--chat-accent': chatColor.accent }}
                >
                  <span>{item.username}</span>
                  <strong>
                    {tr
                      ? `${contentTypeLabel(item.contentType, tr)} ${item.title || roomPick || seasonRoom.shelves.movies[0]} sırasında ${item.moodLabel} hissetti`
                      : `felt ${item.moodLabel} while ${item.contentType ? `${contentTypeLabel(item.contentType, tr)} ` : ''}${item.title || roomPick || seasonRoom.shelves.movies[0]}`}
                  </strong>
                  <em>{item.moodText || (tr ? 'Mood sinyali odaya düştü.' : 'A mood signal entered the room.')}</em>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mot-v3-shelf">
            {activeShelfItems.map((title, index) => {
              const itemKey = getSeasonItemKey(seasonKey, activeShelf, title);
              return (
                <SeasonalShelfItem
                  key={title}
                  title={title}
                  index={index}
                  seasonKey={seasonKey}
                  shelf={activeShelf}
                  done={seasonShelfProgress[activeShelf].includes(itemKey)}
                  review={reviewByItemKey.get(itemKey)}
                  language={prefs.language}
                  onSelect={handleSeasonalComplete}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="mot-v3-badges">
        <div className="mot-v3-section-head">
          <span>{tr ? 'Sezon rozetleri' : 'Season badges'}</span>
          <strong>{seasonCompleted}/{seasonTotal}</strong>
        </div>
        <div className="mot-v3-badge-grid">
          {badgeRows.map((badge) => (
            <div key={badge.id} className={badge.done ? 'is-unlocked' : ''}>
              <span>{badge.done ? (tr ? 'açıldı' : 'unlocked') : badge.count}</span>
              <strong>{badge.label}</strong>
              <em>{badge.count}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="mot-v3-footerline">
        <span><MedalIcon /> {currentLevelTitle}</span>
        <strong>{tr ? 'Bu odadaki her etkileşim sıralamaya bağlanır.' : 'Every interaction in this room feeds the leaderboard.'}</strong>
      </section>

      <SpringReviewModal
        draft={reviewDraft}
        rating={reviewRating}
        emotion={reviewEmotion}
        language={prefs.language}
        saving={reviewSaving}
        onClose={() => setReviewDraft(null)}
        onRating={setReviewRating}
        onEmotion={setReviewEmotion}
        onSave={handleSaveReview}
      />
    </div>
  );
};

export default MotivationPage;
