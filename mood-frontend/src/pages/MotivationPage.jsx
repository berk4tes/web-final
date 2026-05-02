import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../context/UserPreferencesContext';
import api from '../services/api';
import { getVibeColor } from '../utils/constants';

const GAME_KEY = 'moodflix.gameState';
const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const WATCHED_KEY = 'moodflix.watched';
const READ_KEY = 'moodflix.readBooks';
const SEASONAL_PROGRESS_KEY = 'moodflix.seasonalProgress';

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
    hint: { en: 'Done when you mark a Spring track listened.', tr: 'Spring şarkısını dinledim deyince tamamlanır.' },
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

const SEASON_ROOMS = {
  spring: {
    title: { en: 'Spring Rewatch Room', tr: 'Spring Rewatch Odası' },
    subtitle: { en: 'First warm nights, soft rain, fresh-start stories.', tr: 'İlk sıcak akşamlar, hafif yağmur, yeni başlangıç hikayeleri.' },
    cue: { en: 'Now open: spring rewatches', tr: 'Şimdi açık: spring rewatch' },
    shelves: {
      movies: ['Before Sunrise', 'Pride & Prejudice', 'Little Women', 'Past Lives', 'Notting Hill', 'Emma', 'Frances Ha', 'The Half of It', 'Gilmore Girls', 'Anne with an E', 'Heartstopper', 'Daisy Jones & The Six'],
      reads: ['The Secret Garden', 'Normal People', 'A Room with a View', 'Anne of Green Gables', 'Emma', 'Writers & Lovers', 'Book Lovers', 'I Capture the Castle', 'The Enchanted April', 'Persuasion', 'The Blue Castle', 'Convenience Store Woman'],
      music: ['Spring Day', 'Sweet Disposition', 'Bloom', 'April Come She Will', 'Strawberries & Cigarettes', 'There She Goes', 'First Day of My Life', 'Put Your Records On', 'Dreams', 'Sunflower', 'Garden Song', 'Lover'],
    },
  },
  summer: {
    title: { en: 'Summer Night Room', tr: 'Summer Night Odası' },
    subtitle: { en: 'Late drives, open windows, high-glow discoveries.', tr: 'Gece yolları, açık camlar, parlak keşifler.' },
    cue: { en: 'Now open: summer heat picks', tr: 'Şimdi açık: summer heat seçimleri' },
    shelves: {
      movies: ['Mamma Mia!', 'Call Me by Your Name', 'The Parent Trap', 'Moonrise Kingdom', 'The Talented Mr. Ripley', 'Before Sunset', 'Aftersun', 'The Way Way Back', 'Outer Banks', 'The Summer I Turned Pretty', 'Looking for Alaska', 'High Fidelity'],
      reads: ['Malibu Rising', 'Beach Read', 'Daisy Jones & The Six', 'The Summer Book', 'Happy Place', 'The Vacationers', 'Every Summer After', 'The Paper Palace', 'Bonjour Tristesse', 'Call Me by Your Name', 'Open Water', 'Just Kids'],
      music: ['Golden Hour', 'Cruel Summer', 'Sunflower', 'Heat Waves', 'Ribs', 'Good Days', 'Sweet Life', 'Summertime Sadness', 'Slide', 'Walking on a Dream', 'Electric Feel', 'Island in the Sun'],
    },
  },
  autumn: {
    title: { en: 'Autumn Rewatch Room', tr: 'Autumn Rewatch Odası' },
    subtitle: { en: 'Campus walks, old letters, coffee-colored nostalgia.', tr: 'Kampüs yürüyüşleri, eski mektuplar, kahve tonlu nostalji.' },
    cue: { en: 'Now open: autumn comfort rewatches', tr: 'Şimdi açık: autumn comfort rewatch' },
    shelves: {
      movies: ['When Harry Met Sally', 'Dead Poets Society', 'Fantastic Mr. Fox', 'You’ve Got Mail', 'Good Will Hunting', 'Mona Lisa Smile', 'Practical Magic', 'October Sky', 'Gilmore Girls', 'Over the Garden Wall', 'Only Murders in the Building', 'Fleabag'],
      reads: ['If We Were Villains', 'The Secret History', 'Jane Eyre', 'Norwegian Wood', 'Rebecca', 'Babel', 'The Goldfinch', 'Ninth House', 'The Night Circus', 'A Little Life', 'The Bell Jar', 'Wuthering Heights'],
      music: ['Cardigan', 'Autumn Leaves', 'There She Goes', 'Cherry Wine', 'Roslyn', 'Stick Season', 'Motion Sickness', 'Harvest Moon', 'Sweater Weather', 'All Too Well', 'Pink Moon', 'Landslide'],
    },
  },
  winter: {
    title: { en: 'Winter Slow Room', tr: 'Winter Slow Odası' },
    subtitle: { en: 'Quiet rooms, deep focus, stories that stay warm.', tr: 'Sessiz odalar, derin odak, sıcak kalan hikayeler.' },
    cue: { en: 'Now open: winter slow watches', tr: 'Şimdi açık: winter slow watch' },
    shelves: {
      movies: ['Carol', 'Little Women', 'The Holiday', 'The Grand Budapest Hotel', 'Eternal Sunshine of the Spotless Mind', 'About Time', 'Klaus', 'The Holdovers', 'Dash & Lily', 'Normal People', 'The Queen’s Gambit', 'Sherlock'],
      reads: ['A Little Life', 'The Snow Child', 'Wintering', 'Wuthering Heights', 'The Bear and the Nightingale', 'The Left Hand of Darkness', 'The Remains of the Day', 'Frankenstein', 'The Little Prince', 'The Midnight Library', 'The Catcher in the Rye', 'Villette'],
      music: ['Mystery of Love', 'River', 'Holocene', 'No Surprises', 'White Winter Hymnal', 're: Stacks', 'Fourth of July', 'The Night We Met', 'Skinny Love', 'Vienna', 'Fade Into You', 'To Build a Home'],
    },
  },
};

const LEVELS = [
  { min: 0, title: 'Mood Hunter' },
  { min: 250, title: 'Vibe Scout' },
  { min: 600, title: 'Mood Curator' },
  { min: 1000, title: 'Vibe Maestro' },
  { min: 1600, title: 'Cinematic Oracle' },
];

const localDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readGameState = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(GAME_KEY) || '{}');
    return {
      xp: stored.xp || 0,
      checkins: Array.isArray(stored.checkins) ? stored.checkins : [],
      tasksByDay: stored.tasksByDay || {},
    };
  } catch {
    return { xp: 0, checkins: [], tasksByDay: {} };
  }
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

const getSeasonKey = (date = new Date()) => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

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

const readJsonArray = (key) => {
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const readSeasonalProgress = () => {
  try {
    const progress = JSON.parse(localStorage.getItem(SEASONAL_PROGRESS_KEY) || '{}');
    return progress && typeof progress === 'object' ? progress : {};
  } catch {
    return {};
  }
};

const writeSeasonalProgress = (progress) => {
  localStorage.setItem(SEASONAL_PROGRESS_KEY, JSON.stringify(progress));
};

const getSeasonItemKey = (seasonKey, shelf, title) => `${seasonKey}:${shelf}:${title}`;

const MedalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2h8l-2 7h-4L8 2z" />
    <circle cx="12" cy="15" r="5" />
  </svg>
);

const MotivationPage = () => {
  const { user } = useAuth();
  const { prefs, t } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const today = localDateKey();
  const seasonKey = useMemo(() => getSeasonKey(), []);
  const seasonRoom = SEASON_ROOMS[seasonKey];
  const [game, setGame] = useState(readGameState);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activeShelf, setActiveShelf] = useState('movies');
  const [roomPick, setRoomPick] = useState('');
  const [seasonalProgress, setSeasonalProgress] = useState(readSeasonalProgress);
  const [savedVibes, setSavedVibes] = useState(() => readJsonArray(SAVED_VIBES_KEY));

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

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    const refreshLocalSignals = () => {
      setSeasonalProgress(readSeasonalProgress());
      setSavedVibes(readJsonArray(SAVED_VIBES_KEY));
    };

    window.addEventListener('storage', refreshLocalSignals);
    window.addEventListener('focus', refreshLocalSignals);
    return () => {
      window.removeEventListener('storage', refreshLocalSignals);
      window.removeEventListener('focus', refreshLocalSignals);
    };
  }, []);

  const todayTasks = game.tasksByDay[today] || {};
  const remoteTasksToday = summary?.currentUser?.tasksToday || [];
  const todayCheckin = game.checkins.find((item) => item.date === today);
  const seasonProgress = seasonalProgress[seasonKey] || {};
  const seasonShelfProgress = {
    movies: seasonProgress.movies || [],
    music: seasonProgress.music || [],
    reads: seasonProgress.reads || [],
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

  const streak = calculateStreak(game.checkins);
  const activeMood = MOODS.find((mood) => mood.id === todayCheckin?.moodId) || MOODS[0];
  const activeColor = getVibeColor(moodColorKey(activeMood.id));
  const totalXp = summary?.currentUser?.xp ?? game.xp;
  const level = getLevel(totalXp);
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
  const seasonTotal = seasonRoom.shelves.movies.length + seasonRoom.shelves.music.length + seasonRoom.shelves.reads.length;
  const seasonCompleted = seasonShelfProgress.movies.length + seasonShelfProgress.music.length + seasonShelfProgress.reads.length;
  const badgeRows = [
    {
      id: 'watch',
      label: tr ? 'Spring Screen Badge' : 'Spring Screen Badge',
      done: seasonShelfProgress.movies.length >= seasonRoom.shelves.movies.length,
      count: `${seasonShelfProgress.movies.length}/${seasonRoom.shelves.movies.length}`,
    },
    {
      id: 'listen',
      label: tr ? 'Spring Sound Badge' : 'Spring Sound Badge',
      done: seasonShelfProgress.music.length >= seasonRoom.shelves.music.length,
      count: `${seasonShelfProgress.music.length}/${seasonRoom.shelves.music.length}`,
    },
    {
      id: 'read',
      label: tr ? 'Spring Reads Badge' : 'Spring Reads Badge',
      done: seasonShelfProgress.reads.length >= seasonRoom.shelves.reads.length,
      count: `${seasonShelfProgress.reads.length}/${seasonRoom.shelves.reads.length}`,
    },
    {
      id: 'curator',
      label: tr ? 'Season Curator' : 'Season Curator',
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

  const awardTask = async (task) => {
    if (!task) return false;
    if (awardedTaskIds.has(task.id)) return false;
    try {
      const { data } = await api.post('/motivation/award', { taskId: task.id });
      setSummary((prev) => ({
        ...(prev || {}),
        leaderboard: data.data.leaderboard || prev?.leaderboard || [],
        currentUser: data.data.currentUser || prev?.currentUser,
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

  useEffect(() => {
    inferredTaskIds.forEach((taskId) => {
      if (awardedTaskIds.has(taskId)) return;
      const task = DAILY_TASKS.find((item) => item.id === taskId);
      if (task) awardTask(task);
    });
  }, [inferredTaskIds.join('|'), Array.from(awardedTaskIds).join('|')]);

  const handleCheckin = async (mood) => {
    if (todayCheckin) {
      setGame((prev) => ({
        ...prev,
        checkins: prev.checkins.map((item) => item.date === today ? { ...item, moodId: mood.id } : item),
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
      toast(tr ? 'Bu seçim zaten tamamlandı' : 'This pick is already complete');
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
    writeSeasonalProgress(nextProgress);

    if (shelf === 'movies') {
      const contentType = SERIES_TITLES.has(title) ? 'series' : 'movie';
      const existing = readJsonArray(WATCHED_KEY);
      const entry = {
        externalId: key,
        title,
        thumbnail: '',
        contentType,
        watchedAt: new Date().toISOString(),
      };
      if (!existing.some((item) => (item.externalId || item.title) === entry.externalId)) {
        localStorage.setItem(WATCHED_KEY, JSON.stringify([entry, ...existing].slice(0, 100)));
      }
      await awardTask(DAILY_TASKS.find((task) => task.id === 'seasonalWatch'));
    }

    if (shelf === 'music') {
      await awardTask(DAILY_TASKS.find((task) => task.id === 'seasonalListen'));
    }

    if (shelf === 'reads') {
      const existing = readJsonArray(READ_KEY);
      const entry = {
        externalId: key,
        title,
        thumbnail: '',
        contentType: 'book',
        readAt: new Date().toISOString(),
      };
      if (!existing.some((item) => (item.externalId || item.title) === entry.externalId)) {
        localStorage.setItem(READ_KEY, JSON.stringify([entry, ...existing].slice(0, 100)));
      }
      await awardTask(DAILY_TASKS.find((task) => task.id === 'seasonalRead'));
    }

    const completedCountForShelf = nextSeason[shelf].length;
    const totalForShelf = seasonRoom.shelves[shelf].length;
    if (completedCountForShelf === totalForShelf) {
      toast.success(tr ? 'Badge kazandın' : 'Badge unlocked');
    }
  };

  const handleEmotionNote = () => {
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
      writeSeasonalProgress(nextProgress);
    }
    awardTask(DAILY_TASKS.find((task) => task.id === 'emotionNote'));
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
      <section className="mot-v3-hero">
        <div className="mot-v3-copy">
          <span>{t('navMotivation')} / {seasonRoom.cue[prefs.language]}</span>
          <h1>{seasonRoom.title[prefs.language]}</h1>
          <p>
            {tr
              ? 'Bu sayfa artık gerçek bir yarış alanı: DB’deki herkes XP ile sıralanır, günlük görevler hesabına yazılır ve sezon odasında moodlar içeriklerle eşleşir.'
              : 'This is now a real race space: every database user enters by XP, daily quests write to your account, and the seasonal room connects moods with titles.'}
          </p>
          <div className="mot-v3-actions">
            <Link to="/vibe">{tr ? 'Yeni vibe üret' : 'Generate a vibe'}</Link>
            <button type="button" onClick={() => setActiveShelf('chat')}>
              {tr ? 'Mood chat aç' : 'Open mood chat'}
            </button>
          </div>
        </div>

        <div className="mot-v3-rank">
          <span>{tr ? 'global rank' : 'global rank'}</span>
          <strong>#{currentRank}</strong>
          <em>{totalXp} XP</em>
          <div>
            <i style={{ width: `${level.progress}%` }} />
          </div>
          <small>
            {level.next
              ? `${nextXp} XP ${tr ? 'sonra' : 'to'} ${level.next.title}`
              : tr ? 'En üst seviye açık' : 'Top level unlocked'}
          </small>
        </div>
      </section>

      <section className="mot-v3-race">
        <div className="mot-v3-leaderboard">
          <div className="mot-v3-section-head">
            <span>{tr ? 'Gerçek leaderboard' : 'Real leaderboard'}</span>
            <strong>{summaryLoading ? (tr ? 'yükleniyor' : 'loading') : `${leaderboard.length} users`}</strong>
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
            <strong>{streak}/7 streak</strong>
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
          <span>{tr ? 'Daily quests' : 'Daily quests'}</span>
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
              ['reads', tr ? 'Spring Reads' : 'Spring Reads'],
              ['music', tr ? 'Spring Music' : 'Spring Music'],
              ['chat', tr ? 'Mood chat' : 'Mood chat'],
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
            {activeShelfItems.map((title, index) => (
              (() => {
                const done = seasonShelfProgress[activeShelf].includes(getSeasonItemKey(seasonKey, activeShelf, title));
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => handleSeasonalComplete(activeShelf, title)}
                    className={done ? 'is-picked' : ''}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{title}</strong>
                    <em>
                      {done
                        ? (tr ? 'tamamlandı' : 'complete')
                        : activeShelf === 'movies'
                          ? (tr ? 'izledim' : 'mark watched')
                          : activeShelf === 'reads'
                            ? (tr ? 'okudum' : 'mark read')
                            : (tr ? 'dinledim' : 'mark listened')}
                    </em>
                  </button>
                );
              })()
            ))}
          </div>
        )}
      </section>

      <section className="mot-v3-badges">
        <div className="mot-v3-section-head">
          <span>{tr ? 'Season badges' : 'Season badges'}</span>
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
        <span><MedalIcon /> {level.current.title}</span>
        <strong>{tr ? 'Bu odadaki her etkileşim leaderboard’a bağlanır.' : 'Every interaction in this room feeds the leaderboard.'}</strong>
      </section>
    </div>
  );
};

export default MotivationPage;
