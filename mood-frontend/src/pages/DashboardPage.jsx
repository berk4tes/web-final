import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import MoodSummaryCard from '../components/MoodSummaryCard';
import StreakCounter from '../components/StreakCounter';
import { useMoodTheme } from '../context/MoodThemeContext';
import { useUserPreferences } from '../context/UserPreferencesContext';
import api from '../services/api';
import { getVibeColor } from '../utils/constants';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const WATCHED_KEY = 'moodflix.watched';
const READ_KEY = 'moodflix.readBooks';

const CONTENT_FILTERS = ['All', 'movie', 'series', 'book', 'music'];
const filterLabel = (f) => ({ movie: 'Movies', series: 'Series', book: 'Books', music: 'Music' }[f] || f);
const moodLabel = (mood) => ({
  happy: 'Sunlit',
  sad: 'Melancholic',
  excited: 'Electric',
  calm: 'Calm',
  angry: 'Intense',
  nostalgic: 'Nostalgic',
  tired: 'Tired',
  dreamy: 'Dreamy',
}[mood] || mood || 'Calm');

const TABS = [
  { id: 'saved', labelKey: 'savedVibes' },
  { id: 'collection', labelKey: 'collection' },
  { id: 'watched', labelKey: 'watched' },
  { id: 'read', labelKey: 'readTab' },
];

const localDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseMoodHistory = (items = []) =>
  items.map((item) => ({
    id: item._id || `${item.moodLabel}-${item.loggedAt}`,
    moodLabel: item.moodLabel || 'calm',
    moodText: item.moodText || '',
    intensity: item.intensity || 5,
    loggedAt: item.loggedAt || item.createdAt || new Date().toISOString(),
  }));

const moodFromColorKey = (colorKey) => ({
  dreamy: 'calm',
  happy: 'happy',
  sad: 'sad',
  excited: 'excited',
  angry: 'angry',
  nostalgic: 'nostalgic',
  calm: 'calm',
}[colorKey] || 'calm');

const MoodCalendar = ({ history, language }) => {
  const days = useMemo(() => {
    const today = new Date();
    const byDay = new Map();
    history.forEach((entry) => {
      const key = localDateKey(entry.loggedAt);
      if (!key) return;
      const current = byDay.get(key);
      if (!current || entry.intensity >= current.intensity) byDay.set(key, entry);
    });

    return Array.from({ length: 28 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (27 - i));
      const key = localDateKey(date);
      return { key, date, entry: byDay.get(key) };
    });
  }, [history]);

  return (
    <section className="card h-full overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="section-eyebrow">Mood calendar</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink-700">Last 28 days</h2>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-ink-500">
          {history.length} logs
        </span>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map(({ key, date, entry }) => {
          const color = entry ? getVibeColor(entry.moodLabel) : null;
          return (
            <div
              key={key}
              title={entry ? `${moodLabel(entry.moodLabel)}: ${entry.moodText}` : key}
              className="group relative aspect-square rounded-xl border border-ink-100 bg-white/70 transition hover:-translate-y-0.5 sm:rounded-2xl"
              style={entry ? {
                background: `linear-gradient(135deg, ${color.soft}, ${color.accent})`,
                borderColor: color.accent,
              } : {}}
            >
              <span
                className="absolute left-2 top-1.5 text-[10px] font-semibold"
                style={{ color: entry ? color.ink : '#b9b4a4' }}
              >
                {date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric' })}
              </span>
              {entry && (
                <span
                  className="absolute bottom-1.5 right-2 h-2.5 w-2.5 rounded-full bg-white shadow-sm"
                  style={{ boxShadow: `0 0 0 3px ${color.ink}22` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const TasteProfile = ({ savedVibes, favorites, watched, readBooks, history, onReplay, language }) => {
  const tr = language === 'tr';
  const moodCounts = new Map();
  savedVibes.forEach((vibe) => {
    const key = vibe.mood?.colorKey || 'calm';
    moodCounts.set(key, (moodCounts.get(key) || 0) + 2);
  });
  history.forEach((entry) => {
    const key = entry.moodLabel || 'calm';
    moodCounts.set(key, (moodCounts.get(key) || 0) + 1);
  });
  const topMoods = [...moodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const typeCounts = [
    ['music', favorites.filter((x) => x.contentType === 'music').length],
    ['movie', favorites.filter((x) => x.contentType === 'movie' || x.contentType === 'series').length + watched.length],
    ['book', favorites.filter((x) => x.contentType === 'book').length + readBooks.length],
  ].sort((a, b) => b[1] - a[1]);
  const dominantType = typeCounts[0]?.[1] > 0 ? filterLabel(typeCounts[0][0]).toLowerCase() : (tr ? 'keşif' : 'discovery');
  const topMood = topMoods[0]?.[0] || savedVibes[0]?.mood?.colorKey || 'calm';
  const color = getVibeColor(topMood);
  const suggested = savedVibes[0]?.prompt || history[0]?.moodText || (tr ? 'yumuşak bir akşam havası' : 'a soft evening mood');

  return (
    <section
      className="relative h-full overflow-hidden rounded-3xl border border-ink-100 p-6 shadow-soft"
      style={{
        background: `linear-gradient(135deg, ${color.soft}, color-mix(in srgb, ${color.accent} 18%, white))`,
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl" style={{ backgroundColor: `${color.accent}66` }} />
      <div className="relative">
        <span className="section-eyebrow" style={{ color: color.ink }}>
          {tr ? 'Zevk profili' : 'Taste profile'}
        </span>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-700">
          {tr
            ? `${moodLabel(topMood)} havalar ve ${dominantType} ağırlıklı seçimler`
            : `${moodLabel(topMood)} moods with a ${dominantType} lean`}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
          {tr
            ? 'Kaydettiğin vibe ve koleksiyonlara göre keşif zevkin burada toparlanıyor.'
            : 'A living snapshot of your saved vibes, collection, and recent mood history.'}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(topMoods.length ? topMoods : [[topMood, 1]]).map(([key, count]) => {
            const c = getVibeColor(key);
            return (
              <span
                key={key}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: c.soft, color: c.ink }}
              >
                {moodLabel(key)} · {count}
              </span>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onReplay({ prompt: suggested })}
          className="mt-6 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
          style={{ backgroundColor: color.accent }}
        >
          {tr ? 'Bu tada benzer keşfet' : 'Explore this taste'}
        </button>
      </div>
    </section>
  );
};

const MoodTimeline = ({ history, savedVibes, onReplay, language }) => {
  const tr = language === 'tr';
  const entries = history.slice(0, 5);
  const fallback = savedVibes.slice(0, 5).map((vibe) => ({
    id: vibe.id,
    moodLabel: moodFromColorKey(vibe.mood?.colorKey),
    moodText: vibe.prompt,
    intensity: Math.round((vibe.mood?.intensity || 0.5) * 10),
    loggedAt: vibe.savedAt,
    title: vibe.mood?.title,
  }));
  const timeline = entries.length ? entries : fallback;

  return (
    <section className="card h-full">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <span className="section-eyebrow">{tr ? 'Mood akışı' : 'Mood timeline'}</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink-700">
            {tr ? 'Son aramalar' : 'Recent searches'}
          </h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          {timeline.length} {tr ? 'kayıt' : 'items'}
        </span>
      </div>

      {timeline.length === 0 ? (
        <p className="text-sm text-ink-400">
          {tr ? 'Henüz timeline için yeterli mood yok.' : 'Generate a few vibes to build your timeline.'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {timeline.map((entry) => {
            const color = getVibeColor(entry.moodLabel);
            const date = new Date(entry.loggedAt);
            const badge = moodLabel(entry.moodLabel).slice(0, 2).toUpperCase();
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => entry.moodText && onReplay({ prompt: entry.moodText })}
                className="group flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-white/70 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl text-[11px] font-bold"
                  style={{ backgroundColor: color.soft, color: color.ink }}
                >
                  {badge}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-1 text-sm font-semibold text-ink-700">
                    {entry.title || moodLabel(entry.moodLabel)}
                  </span>
                  <span className="mt-0.5 block line-clamp-1 text-xs text-ink-400">
                    {entry.moodText || moodLabel(entry.moodLabel)}
                  </span>
                </span>
                <span className="hidden text-xs text-ink-400 sm:block">
                  {date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

// Card for a saved vibe — interactive, re-runs search on click
const SavedVibeCard = ({ vibe, onRemove, onReplay }) => {
  const color = getVibeColor(vibe.mood?.colorKey);
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 transition-all duration-300 cursor-pointer"
      style={hovered ? { borderColor: color.accent, boxShadow: `0 0 0 2px ${color.soft}, 0 8px 24px ${color.soft}` } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onReplay(vibe)}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300"
        style={{ opacity: hovered ? 0.35 : 0, background: `linear-gradient(135deg, ${color.soft}, transparent)` }}
      />
      <div className="relative">
        <span
          className="section-eyebrow transition-colors duration-300"
          style={hovered ? { color: color.accent } : {}}
        >
          {vibe.mood?.colorKey || 'calm'}
        </span>
        <h3 className="mt-2 font-display text-xl font-semibold text-ink-700">
          {vibe.mood?.title || 'Saved vibe'}
        </h3>
        <p className="mt-1 text-sm italic text-ink-500">"{vibe.prompt}"</p>

        {vibe.mood?.tags && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vibe.mood.tags.slice(0, 4).map((t, i) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-300"
                style={{
                  backgroundColor: hovered ? color.soft : '#efeee8',
                  color: hovered ? color.ink : '#52503f',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
          <span>{new Date(vibe.savedAt).toLocaleDateString()}</span>
          <div className="flex items-center gap-3">
            <span
              className="font-medium transition-colors duration-200"
              style={hovered ? { color: color.accent } : {}}
            >
              Play again
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(vibe.id); }}
              className="text-rose-400 hover:text-rose-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const CollectionIcon = ({ type }) => {
  if (type === 'book') {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
  }
  if (type === 'music') {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v7"/></svg>;
  }
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
};

// Card for favorites in the Collection tab, matching the Vibe page hover reveal style.
const CollectionCard = ({ item, onRemove }) => {
  const savedDate = item.savedAt ? new Date(item.savedAt).toLocaleDateString() : '';

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_54px_rgba(31,29,24,0.16)]">
      <div className="relative aspect-[4/5] bg-ink-100">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink-100 to-white">
            <CollectionIcon type={item.contentType} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink-800/90 via-ink-800/24 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-700">
            {filterLabel(item.contentType)}
          </span>
          <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-tight text-white">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-white/75">
            {savedDate ? `Saved ${savedDate}` : 'Saved to collection'}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <a
              href={
                item.contentType === 'music'
                  ? `https://open.spotify.com/search/${encodeURIComponent(item.title)}`
                  : item.contentType === 'book'
                    ? `https://www.goodreads.com/search?q=${encodeURIComponent(item.title)}`
                    : `https://www.imdb.com/find/?q=${encodeURIComponent(item.title)}`
              }
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
            >
              Details
            </a>
            <button
              type="button"
              onClick={() => onRemove(item._id)}
              className="rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-rose-500"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink-700">{item.title}</h3>
        <p className="mt-1 text-xs uppercase tracking-wider text-ink-400">{filterLabel(item.contentType)}</p>
      </div>
    </article>
  );
};

// Card for watched items
const WatchedCard = ({ item, onRemove }) => (
  <article className="card flex items-center gap-3">
    {item.thumbnail ? (
      <img src={item.thumbnail} alt={item.title} className="h-16 w-12 flex-shrink-0 rounded-xl object-cover" />
    ) : (
      <div className="grid h-16 w-12 flex-shrink-0 place-items-center rounded-xl bg-ink-100">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h3 className="line-clamp-1 text-sm font-semibold text-ink-700">{item.title}</h3>
      <p className="text-xs text-ink-400">{new Date(item.watchedAt).toLocaleDateString()}</p>
    </div>
    <button
      onClick={() => onRemove(item.externalId || item.title)}
      className="rounded-full border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
    >
      Remove
    </button>
  </article>
);

const ReadCard = ({ item, onRemove }) => (
  <article className="card flex items-center gap-3">
    {item.thumbnail ? (
      <img src={item.thumbnail} alt={item.title} className="h-16 w-12 flex-shrink-0 rounded-xl object-cover" />
    ) : (
      <div className="grid h-16 w-12 flex-shrink-0 place-items-center rounded-xl bg-ink-100">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h3 className="line-clamp-1 text-sm font-semibold text-ink-700">{item.title}</h3>
      <p className="text-xs text-ink-400">{new Date(item.readAt).toLocaleDateString()}</p>
    </div>
    <button
      onClick={() => onRemove(item.externalId || item.title)}
      className="rounded-full border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
    >
      Remove
    </button>
  </article>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { theme } = useMoodTheme();
  const { prefs, t } = useUserPreferences();

  const [streak, setStreak] = useState(0);
  const [summary, setSummary] = useState(null);

  const [activeTab, setActiveTab] = useState('saved');
  const [contentFilter, setContentFilter] = useState('All');

  const [savedVibes, setSavedVibes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [watched, setWatched] = useState([]);
  const [readBooks, setReadBooks] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);

  // Load stats
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [s, sum] = await Promise.all([
          api.get('/stats/streak'),
          api.get('/stats/summary'),
        ]);
        if (!active) return;
        setStreak(s.data.data.streak);
        setSummary(sum.data.data);
      } catch {
        toast.error('Could not load stats');
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/moods/history', { params: { limit: 60 } });
        if (active) setMoodHistory(parseMoodHistory(data.data.items));
      } catch {
        // Timeline falls back to saved vibes when backend history is unavailable.
      }
    };
    loadHistory();
    return () => { active = false; };
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(SAVED_VIBES_KEY) || '[]');
      if (Array.isArray(v)) setSavedVibes(v);
    } catch {}
    try {
      const w = JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]');
      if (Array.isArray(w)) setWatched(w);
    } catch {}
    try {
      const r = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
      if (Array.isArray(r)) setReadBooks(r);
    } catch {}
  }, []);

  // Load favorites for collection cards and taste profile
  useEffect(() => {
    let active = true;
    const load = async () => {
      setFavLoading(true);
      try {
        const { data } = await api.get('/favorites', { params: { limit: 100 } });
        if (active) setFavorites(data.data.items);
      } catch {
        toast.error('Could not load favorites');
      } finally {
        if (active) setFavLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handleRemoveVibe = (id) => {
    const next = savedVibes.filter((v) => v.id !== id);
    setSavedVibes(next);
    localStorage.setItem(SAVED_VIBES_KEY, JSON.stringify(next));
    toast.success('Vibe removed');
  };

  const handleReplayVibe = (vibe) => {
    navigate('/vibe', { state: { replayPrompt: vibe.prompt } });
  };

  const handleDiscoverMore = () => {
    const last = savedVibes[0]?.prompt || summary?.topMood;
    navigate('/vibe', last ? { state: { replayPrompt: last } } : undefined);
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((f) => f._id !== id));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Could not remove');
    }
  };

  const handleRemoveWatched = (externalId) => {
    const next = watched.filter((w) => (w.externalId || w.title) !== externalId);
    setWatched(next);
    localStorage.setItem(WATCHED_KEY, JSON.stringify(next));
  };

  const handleRemoveRead = (externalId) => {
    const next = readBooks.filter((b) => (b.externalId || b.title) !== externalId);
    setReadBooks(next);
    localStorage.setItem(READ_KEY, JSON.stringify(next));
  };

  const filteredFavorites = contentFilter === 'All'
    ? favorites
    : favorites.filter((f) => f.contentType === contentFilter);

  const filteredWatched = contentFilter === 'All'
    ? watched
    : watched.filter((w) => w.contentType === contentFilter);

  const tabAccentColor = theme?.accent || '#7c5cff';
  const language = prefs.language || 'en';

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <span className="section-eyebrow">{t('navDashboard')}</span>
        <h1 className="section-title mt-2">{t('dashboardTitle')}</h1>
        <p className="mt-1 text-sm text-ink-400">{t('dashboardCaption')}</p>
      </div>

      {/* Stats row */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StreakCounter streak={streak} />
        </div>
        <div className="lg:col-span-2">
          <MoodSummaryCard summary={summary} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TasteProfile
          savedVibes={savedVibes}
          favorites={favorites}
          watched={watched}
          readBooks={readBooks}
          history={moodHistory}
          onReplay={handleReplayVibe}
          language={language}
        />
        <MoodCalendar history={moodHistory} language={language} />
        <MoodTimeline
          history={moodHistory}
          savedVibes={savedVibes}
          onReplay={handleReplayVibe}
          language={language}
        />
      </section>

      {/* Tabs */}
      <section className="rounded-[2rem] border border-ink-100 bg-white/60 p-4 shadow-soft backdrop-blur sm:p-5">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/80 p-1 sm:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id ? 'text-white shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
                style={activeTab === tab.id ? { backgroundColor: tabAccentColor } : {}}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <button type="button" onClick={handleDiscoverMore} className="btn-secondary shrink-0 text-sm">
            {t('discoverMore')}
          </button>
        </div>

        {/* Saved Vibes tab */}
        {activeTab === 'saved' && (
          savedVibes.length === 0 ? (
            <EmptyState
              title={t('noSavedVibes')}
              description={t('noSavedVibesBody')}
              action={<Link to="/vibe" className="btn-accent">Try it now</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {savedVibes.map((v) => (
                <SavedVibeCard
                  key={v.id}
                  vibe={v}
                  onRemove={handleRemoveVibe}
                  onReplay={handleReplayVibe}
                />
              ))}
            </div>
          )
        )}

        {/* Collection tab (Favorites) */}
        {activeTab === 'collection' && (
          <>
            {/* Content type filters */}
            <div className="mb-5 flex flex-wrap gap-2">
              {CONTENT_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setContentFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                    contentFilter === f
                      ? 'text-white'
                      : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                  }`}
                  style={contentFilter === f ? { backgroundColor: tabAccentColor } : {}}
                >
                  {filterLabel(f)}
                </button>
              ))}
            </div>

            {favLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card h-36 animate-pulse" />
                ))}
              </div>
            ) : filteredFavorites.length === 0 ? (
              <EmptyState
                title={t('noItems')}
                description={t('noItemsBody')}
                action={<Link to="/vibe" className="btn-accent">Discover vibes</Link>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFavorites.map((fav) => (
                  <CollectionCard key={fav._id} item={fav} onRemove={handleRemoveFavorite} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Watched tab */}
        {activeTab === 'watched' && (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              {CONTENT_FILTERS.filter((f) => f !== 'book').map((f) => (
                <button
                  key={f}
                  onClick={() => setContentFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                    contentFilter === f
                      ? 'text-white'
                      : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                  }`}
                  style={contentFilter === f ? { backgroundColor: tabAccentColor } : {}}
                >
                  {filterLabel(f)}
                </button>
              ))}
            </div>
            {filteredWatched.length === 0 ? (
            <EmptyState
              title={t('noWatched')}
              description={t('noWatchedBody')}
              action={<Link to="/vibe" className="btn-accent">Generate a vibe</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWatched.map((item, i) => (
                <WatchedCard key={i} item={item} onRemove={handleRemoveWatched} />
              ))}
            </div>
          )}
          </>
        )}

        {activeTab === 'read' && (
          readBooks.length === 0 ? (
            <EmptyState
              title={t('noRead')}
              description={t('noReadBody')}
              action={<Link to="/vibe" className="btn-accent">Find books</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {readBooks.map((item, i) => (
                <ReadCard key={i} item={item} onRemove={handleRemoveRead} />
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
