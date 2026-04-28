import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import MoodSummaryCard from '../components/MoodSummaryCard';
import StreakCounter from '../components/StreakCounter';
import WeeklyMoodChart from '../components/WeeklyMoodChart';
import { useMoodTheme } from '../context/MoodThemeContext';
import api from '../services/api';
import { getVibeColor } from '../utils/constants';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const WATCHED_KEY = 'moodflix.watched';

const CONTENT_FILTERS = ['All', 'movie', 'series', 'book', 'music'];
const filterLabel = (f) => ({ movie: 'Movies', series: 'Series', book: 'Books', music: 'Music' }[f] || f);

const TABS = ['Saved Vibes', 'Collection', 'Watched'];

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

// Card for favorites in the Collection tab
const CollectionCard = ({ item, onRemove }) => (
  <article className="card flex flex-col">
    <div className="flex items-start gap-3">
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.title}
          className="h-20 w-14 flex-shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="grid h-20 w-14 flex-shrink-0 place-items-center rounded-xl bg-ink-100 text-2xl">
          {item.contentType === 'book' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          ) : item.contentType === 'music' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-700">{item.title}</h3>
        <span className="chip mt-2">{item.contentType}</span>
      </div>
    </div>
    <button
      onClick={() => onRemove(item._id)}
      className="mt-3 self-end rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50"
    >
      Remove
    </button>
  </article>
);

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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { theme } = useMoodTheme();

  const [weekly, setWeekly] = useState({ days: [] });
  const [streak, setStreak] = useState(0);
  const [summary, setSummary] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('Saved Vibes');
  const [contentFilter, setContentFilter] = useState('All');

  const [savedVibes, setSavedVibes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [watched, setWatched] = useState([]);

  // Load stats
  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatsLoading(true);
      try {
        const [w, s, sum] = await Promise.all([
          api.get('/stats/weekly'),
          api.get('/stats/streak'),
          api.get('/stats/summary'),
        ]);
        if (!active) return;
        setWeekly(w.data.data);
        setStreak(s.data.data.streak);
        setSummary(sum.data.data);
      } catch {
        toast.error('Could not load stats');
      } finally {
        if (active) setStatsLoading(false);
      }
    };
    load();
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
  }, []);

  // Load favorites when Collection tab is active
  useEffect(() => {
    if (activeTab !== 'Collection') return;
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
  }, [activeTab]);

  const handleRemoveVibe = (id) => {
    const next = savedVibes.filter((v) => v.id !== id);
    setSavedVibes(next);
    localStorage.setItem(SAVED_VIBES_KEY, JSON.stringify(next));
    toast.success('Vibe removed');
  };

  const handleReplayVibe = (vibe) => {
    navigate('/vibe', { state: { replayPrompt: vibe.prompt } });
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

  const filteredFavorites = contentFilter === 'All'
    ? favorites
    : favorites.filter((f) => f.contentType === contentFilter);

  const tabAccentColor = theme?.accent || '#7c5cff';

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <span className="section-eyebrow">Your space</span>
        <h1 className="section-title mt-2">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-400">A quiet view of your moods over time.</p>
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

      {/* Weekly chart */}
      <section>
        {statsLoading ? (
          <div className="card h-72 animate-pulse" />
        ) : (
          <WeeklyMoodChart days={weekly.days} />
        )}
      </section>

      {/* Tabs */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-1 rounded-2xl border border-ink-100 bg-white p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab ? 'text-white shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
                style={activeTab === tab ? { backgroundColor: tabAccentColor } : {}}
              >
                {tab}
              </button>
            ))}
          </div>

          <Link to="/vibe" className="btn-secondary text-sm">
            Discover more
          </Link>
        </div>

        {/* Saved Vibes tab */}
        {activeTab === 'Saved Vibes' && (
          savedVibes.length === 0 ? (
            <EmptyState
              title="No saved vibes yet"
              description="Generate a vibe and tap 'Save this vibe' to keep it here."
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
        {activeTab === 'Collection' && (
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
                title="No items here"
                description="Heart items on the Vibe page to add them to your collection."
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
        {activeTab === 'Watched' && (
          watched.length === 0 ? (
            <EmptyState
              title="Nothing watched yet"
              description="Click 'Watched' on any film card to track it here."
              action={<Link to="/vibe" className="btn-accent">Generate a vibe</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {watched.map((item, i) => (
                <WatchedCard key={i} item={item} onRemove={handleRemoveWatched} />
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
