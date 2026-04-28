// DashboardPage — analytics + recent vibe history (light theme)
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import MoodSummaryCard from '../components/MoodSummaryCard';
import StreakCounter from '../components/StreakCounter';
import WeeklyMoodChart from '../components/WeeklyMoodChart';
import api from '../services/api';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';

const DashboardPage = () => {
  const [weekly, setWeekly] = useState({ days: [] });
  const [streak, setStreak] = useState(0);
  const [summary, setSummary] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [savedVibes, setSavedVibes] = useState([]);

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
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_VIBES_KEY) || '[]');
      if (Array.isArray(stored)) setSavedVibes(stored);
    } catch {
      // ignore
    }
    return () => {
      active = false;
    };
  }, []);

  const handleRemoveVibe = (id) => {
    const next = savedVibes.filter((v) => v.id !== id);
    setSavedVibes(next);
    localStorage.setItem(SAVED_VIBES_KEY, JSON.stringify(next));
    toast.success('Vibe removed');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <span className="section-eyebrow">Your space</span>
        <h1 className="section-title mt-2">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-400">A quiet view of your moods over time.</p>
      </div>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StreakCounter streak={streak} />
        </div>
        <div className="lg:col-span-2">
          <MoodSummaryCard summary={summary} />
        </div>
      </section>

      <section>
        {statsLoading ? (
          <div className="card h-72 animate-pulse" />
        ) : (
          <WeeklyMoodChart days={weekly.days} />
        )}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <span className="section-eyebrow">Saved vibes</span>
            <h2 className="font-display text-2xl font-semibold text-ink-700 mt-1">Your collection</h2>
          </div>
          <Link to="/vibe" className="btn-secondary">
            Discover more
          </Link>
        </div>

        {savedVibes.length === 0 ? (
          <EmptyState
            icon="🌿"
            title="No saved vibes yet"
            description="Generate a vibe and tap 'Save this vibe' to keep it here."
            action={
              <Link to="/vibe" className="btn-accent">
                Try it now
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {savedVibes.map((v) => (
              <article key={v.id} className="card group relative overflow-hidden">
                <div
                  className={`pointer-events-none absolute inset-0 opacity-50 bg-gradient-to-br from-white via-${v.mood?.colorKey || 'amber'}-100 to-white`}
                />
                <div className="relative">
                  <span className="section-eyebrow">{v.mood?.colorKey || 'calm'}</span>
                  <h3 className="mt-2 font-display text-xl font-semibold text-ink-700">
                    {v.mood?.title || 'Saved vibe'}
                  </h3>
                  <p className="mt-1 text-sm italic text-ink-500">"{v.prompt}"</p>
                  {v.mood?.tags && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {v.mood.tags.slice(0, 4).map((t, i) => (
                        <span key={i} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
                    <span>{new Date(v.savedAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleRemoveVibe(v.id)}
                      className="text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
