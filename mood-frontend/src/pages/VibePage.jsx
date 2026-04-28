import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookCard from '../components/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import LoadingVibeState from '../components/LoadingVibeState';
import MoodSummary from '../components/MoodSummary';
import MoodboardGrid from '../components/MoodboardGrid';
import MovieCard from '../components/MovieCard';
import MovieDetailModal from '../components/MovieDetailModal';
import MusicCard from '../components/MusicCard';
import SectionHeader from '../components/SectionHeader';
import { useMoodTheme } from '../context/MoodThemeContext';
import useFavorites from '../hooks/useFavorites';
import api from '../services/api';
import { VIBE_PROMPT_EXAMPLES, getPromptSuggestions, getVibeColor } from '../utils/constants';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';

const BookmarkIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const VibePage = () => {
  const location = useLocation();
  const { vibeData, setVibe, colorKey, theme } = useMoodTheme();
  const { isFavorite, toggle } = useFavorites();

  // Input state
  const [prompt, setPrompt] = useState(() => vibeData?.prompt || '');
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);

  // UI state
  const [movieDetail, setMovieDetail] = useState(null);
  const [bookDetail, setBookDetail] = useState(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [savedVibes, setSavedVibes] = useState([]);

  // Per-section lists (allow card dismissal without mutating context)
  const [movieList, setMovieList] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [musicList, setMusicList] = useState([]);

  // Track which vibe data is currently in the lists so we reset on new search
  const vibeIdRef = useRef(null);
  const intensityTimerRef = useRef(null);
  const generateRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_VIBES_KEY) || '[]');
      if (Array.isArray(stored)) setSavedVibes(stored);
    } catch {
      // ignore
    }
  }, []);

  // Sync per-section lists when a new vibe arrives
  useEffect(() => {
    if (!vibeData) {
      vibeIdRef.current = null;
      setMovieList([]);
      setBookList([]);
      setMusicList([]);
      return;
    }
    const id = `${vibeData.prompt}_${vibeData.mood?.title}`;
    if (id !== vibeIdRef.current) {
      vibeIdRef.current = id;
      setMovieList(vibeData.sections?.movies || []);
      setBookList(vibeData.sections?.books || []);
      setMusicList(vibeData.sections?.music || []);
    }
  }, [vibeData]);

  const isSaved = useMemo(() => {
    if (!vibeData) return false;
    return savedVibes.some(
      (v) => v.prompt === vibeData.prompt && v.mood?.title === vibeData.mood?.title
    );
  }, [vibeData, savedVibes]);

  const heroColor = vibeData ? getVibeColor(vibeData.mood?.colorKey) : null;

  const handleGenerate = async (overridePrompt, overrideIntensity) => {
    const value = (overridePrompt ?? prompt).trim();
    if (value.length < 3) {
      toast.error('Write a few more words about your vibe');
      return;
    }
    setLoading(true);
    try {
      const intensityLevel = overrideIntensity ?? intensity;
      const intensityHint =
        intensityLevel <= 3 ? ' (subtle, understated atmosphere)' :
        intensityLevel >= 8 ? ' (intense, overwhelming atmosphere)' : '';
      const finalPrompt = value + intensityHint;

      const { data: res } = await api.post('/recommendations/vibe', { prompt: finalPrompt });
      const data = { ...res.data, prompt: value };
      setVibe(data);
      setPrompt(value);
      setTimeout(() => {
        document.getElementById('vibe-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not interpret your vibe');
    } finally {
      setLoading(false);
    }
  };

  generateRef.current = handleGenerate;

  // Handle replay navigation from Dashboard
  useEffect(() => {
    const replayPrompt = location.state?.replayPrompt;
    if (replayPrompt) {
      setPrompt(replayPrompt);
      window.history.replaceState({}, document.title);
      generateRef.current(replayPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIntensityChange = (val) => {
    setIntensity(val);
    if (!vibeData || !prompt) return;
    clearTimeout(intensityTimerRef.current);
    intensityTimerRef.current = setTimeout(() => {
      generateRef.current(prompt, val);
    }, 1200);
  };

  const handleRefineSubmit = (e) => {
    e.preventDefault();
    const val = refinePrompt.trim();
    if (val.length < 3) return;
    setPrompt(val);
    handleGenerate(val);
    setRefinePrompt('');
  };

  const handleSaveVibe = () => {
    if (!vibeData) return;
    if (isSaved) {
      const next = savedVibes.filter(
        (v) => !(v.prompt === vibeData.prompt && v.mood?.title === vibeData.mood?.title)
      );
      setSavedVibes(next);
      localStorage.setItem(SAVED_VIBES_KEY, JSON.stringify(next));
      toast.success('Vibe removed');
      return;
    }
    const entry = {
      id: Date.now(),
      prompt: vibeData.prompt,
      mood: vibeData.mood,
      sections: vibeData.sections,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...savedVibes].slice(0, 30);
    setSavedVibes(next);
    localStorage.setItem(SAVED_VIBES_KEY, JSON.stringify(next));
    toast.success('Vibe saved');
  };

  const WATCHED_KEY = 'moodflix.watched';

  const dismissMovie = (item) => {
    const id = item._id || item.title;
    setMovieList((prev) => prev.filter((m) => (m._id || m.title) !== id));
    // Persist to watched list for Dashboard
    try {
      const existing = JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]');
      const entry = {
        externalId: item.externalId || item.title,
        title: item.title,
        thumbnail: item.poster,
        contentType: 'movie',
        watchedAt: new Date().toISOString(),
      };
      if (!existing.some((w) => (w.externalId || w.title) === (entry.externalId || entry.title))) {
        localStorage.setItem(WATCHED_KEY, JSON.stringify([entry, ...existing].slice(0, 100)));
      }
    } catch {}
  };

  const dismissBook = (id) => setBookList((prev) => prev.filter((b) => (b._id || b.title) !== id));

  // Dynamic prompt suggestions based on the current mood colorKey
  const promptSuggestions = colorKey
    ? getPromptSuggestions(colorKey)
    : VIBE_PROMPT_EXAMPLES.slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      {/* Hero input card */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white/80 p-8 shadow-soft backdrop-blur sm:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/8 blur-3xl" />
        <div
          className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full blur-3xl transition-colors duration-700"
          style={{ backgroundColor: theme ? `${theme.soft}88` : 'rgba(230,181,74,0.2)' }}
        />

        <div className="relative max-w-3xl">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-700 text-balance sm:text-6xl">
            Describe a feeling.<br />
            Get a playlist, films, and books.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500 text-balance sm:text-lg">
            Type a mood, atmosphere, or a media reference — we'll interpret the vibe and craft a full discovery moment.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Feels like Gilmore Girls in autumn..."
              maxLength={500}
              className="input flex-1 text-base"
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn-accent text-base">
              {loading ? 'Interpreting...' : 'Generate'}
            </button>
          </form>

          {/* Emotional intensity slider */}
          <div className="mt-6 flex items-center gap-4">
            <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-ink-400">
              Intensity
            </span>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => handleIntensityChange(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer rounded-full accent-accent"
              style={theme ? { accentColor: theme.accent } : {}}
            />
            <span
              className="w-6 text-right text-xs font-semibold tabular-nums"
              style={{ color: theme ? theme.accent : '#7c5cff' }}
            >
              {intensity}
            </span>
          </div>

          {/* Prompt suggestions — dynamic based on current mood */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Try:</span>
            {promptSuggestions.map((ex) => (
              <button
                key={ex}
                onClick={() => handleGenerate(ex)}
                disabled={loading}
                className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 transition hover:border-accent hover:text-accent-ink disabled:opacity-50"
                style={{ '--tw-ring-color': theme?.accent }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results area */}
      <div id="vibe-results" className="mt-12 space-y-12">
        {loading && <LoadingVibeState message="Interpreting your atmosphere..." />}

        {!loading && !vibeData && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-ink-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink-700">
              Your discovery moment will appear here
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-400">
              The more evocative the prompt, the richer the vibe. Try citing a feeling, a place, a piece of media, or even a weather.
            </p>
          </div>
        )}

        {vibeData && !loading && (
          <>
            <MoodSummary
              prompt={vibeData.prompt}
              mood={vibeData.mood}
              onSave={handleSaveVibe}
              isSaved={isSaved}
            />

            {musicList.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow="Soundtrack"
                  title="A playlist for the moment"
                  caption="Curated to match the rhythm of your vibe."
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {musicList.map((m) => (
                    <MusicCard
                      key={m._id || m.title}
                      item={m}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggle}
                    />
                  ))}
                </div>
              </section>
            )}

            {movieList.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow="Watch"
                  title="Films & series to escape into"
                  caption="Hover for a peek, click to dive deeper — never leaves the page."
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {movieList.map((m) => (
                    <MovieCard
                      key={m._id || m.title}
                      item={m}
                      onClick={setMovieDetail}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggle}
                      onWatched={dismissMovie}
                    />
                  ))}
                </div>
              </section>
            )}

            {bookList.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow="Read"
                  title="Books that breathe the same air"
                  caption="Hand-picked for the texture of this mood."
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {bookList.map((b) => (
                    <BookCard
                      key={b._id || b.title}
                      item={b}
                      onClick={setBookDetail}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggle}
                      onRead={dismissBook}
                    />
                  ))}
                </div>
              </section>
            )}

            <MoodboardGrid sections={vibeData.sections} mood={vibeData.mood} />

            {/* Secondary refine bar */}
            <section className="card animate-slide-up">
              <h3 className="font-display text-xl font-semibold text-ink-700">Refine your vibe</h3>
              <p className="mt-1 text-sm text-ink-400">Adjust the atmosphere with more context.</p>
              <form onSubmit={handleRefineSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Add more context — a feeling, a place, a sound..."
                  className="input flex-1"
                />
                <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
                  Refine
                </button>
              </form>
            </section>
          </>
        )}
      </div>

      {/* Floating save button */}
      {vibeData && !loading && heroColor && (
        <button
          onClick={handleSaveVibe}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-glow backdrop-blur transition hover:scale-105 active:scale-95"
          style={{
            backgroundColor: isSaved ? heroColor.accent : 'white',
            color: isSaved ? 'white' : heroColor.ink,
            border: `1.5px solid ${heroColor.accent}`,
          }}
        >
          <BookmarkIcon filled={isSaved} />
          {isSaved ? 'Vibe saved' : 'Save this vibe'}
        </button>
      )}

      <MovieDetailModal item={movieDetail} onClose={() => setMovieDetail(null)} />
      <BookDetailModal
        item={bookDetail}
        onClose={() => setBookDetail(null)}
        isFavorite={isFavorite}
        onToggleFavorite={toggle}
      />
    </div>
  );
};

export default VibePage;
