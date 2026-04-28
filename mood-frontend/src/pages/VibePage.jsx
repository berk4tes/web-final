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
import { REC_PREFS_DEFAULTS, useUserPreferences } from '../context/UserPreferencesContext';
import useFavorites from '../hooks/useFavorites';
import api from '../services/api';
import { VIBE_PROMPT_EXAMPLES, getPromptSuggestions, getVibeColor } from '../utils/constants';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const WATCHED_KEY = 'moodflix.watched';
const READ_KEY = 'moodflix.readBooks';
const VIBE_LISTS_KEY = 'moodflix.currentVibeLists';
const VISIBLE_MEDIA_COUNT = 5;

const BookmarkIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const VibePage = () => {
  const location = useLocation();
  const { vibeData, setVibe, colorKey, theme, setDraftMoodFromPrompt } = useMoodTheme();
  const { prefs, t } = useUserPreferences();
  const { favoriteMap, isFavorite, toggle } = useFavorites();

  // Input state
  const [prompt, setPrompt] = useState(() => vibeData?.prompt || '');
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);

  // UI state
  const [movieDetail, setMovieDetail] = useState(null);
  const [bookDetail, setBookDetail] = useState(null);
  const [savedVibes, setSavedVibes] = useState([]);

  // Per-section lists (allow card dismissal without mutating context)
  const [movieList, setMovieList] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [musicList, setMusicList] = useState([]);

  // Track which vibe data is currently in the lists so we reset on new search
  const vibeIdRef = useRef(null);
  const intensityTimerRef = useRef(null);
  const generateRef = useRef(null);
  const recPrefs = { ...REC_PREFS_DEFAULTS, ...(prefs.recPrefs || {}) };

  const getItemId = (item) => item.externalId || item._id || item.title;

  const getStoredIds = (key) => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(stored)) return new Set();
      return new Set(stored.map((item) => item.externalId || item.title).filter(Boolean));
    } catch {
      return new Set();
    }
  };

  const filterAlreadyCollected = (items, extraKey) => {
    const favorites = new Set(Object.keys(favoriteMap || {}));
    const extra = extraKey ? getStoredIds(extraKey) : new Set();
    return (items || []).filter((item) => {
      const id = getItemId(item);
      return id && !favorites.has(id) && !extra.has(id);
    });
  };

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
      let restored = null;
      try {
        restored = JSON.parse(localStorage.getItem(VIBE_LISTS_KEY) || 'null');
      } catch {
        restored = null;
      }
      if (restored?.id === id) {
        setMovieList(filterAlreadyCollected(restored.movies || [], WATCHED_KEY));
        setBookList(filterAlreadyCollected(restored.books || [], READ_KEY));
        setMusicList(filterAlreadyCollected(restored.music || []));
      } else {
        setMovieList(filterAlreadyCollected(vibeData.sections?.movies, WATCHED_KEY));
        setBookList(filterAlreadyCollected(vibeData.sections?.books, READ_KEY));
        setMusicList(filterAlreadyCollected(vibeData.sections?.music));
      }
    }
  }, [vibeData, favoriteMap]);

  useEffect(() => {
    if (!vibeData || !vibeIdRef.current) return;
    localStorage.setItem(
      VIBE_LISTS_KEY,
      JSON.stringify({
        id: vibeIdRef.current,
        movies: movieList,
        books: bookList,
        music: musicList,
      })
    );
  }, [vibeData, movieList, bookList, musicList]);

  useEffect(() => {
    setMovieList((prev) => filterAlreadyCollected(prev, WATCHED_KEY));
    setBookList((prev) => filterAlreadyCollected(prev, READ_KEY));
    setMusicList((prev) => filterAlreadyCollected(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteMap]);

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
      const preferenceHint = [
        recPrefs.highMatchOnly ? 'prioritize only high-confidence matches' : '',
        recPrefs.showNiche && !recPrefs.showPopular ? 'avoid obvious popular picks and choose niche recommendations' : '',
        recPrefs.showPopular && !recPrefs.showNiche ? 'prioritize recognizable popular recommendations' : '',
      ].filter(Boolean).join('; ');
      const finalPrompt = `${value}${intensityHint}${preferenceHint ? ` (${preferenceHint})` : ''}`;

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

  const dismissMovie = (item) => {
    const id = getItemId(item);
    setMovieList((prev) => prev.filter((m) => getItemId(m) !== id));
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

  const dismissBook = (item) => {
    const id = getItemId(item);
    setBookList((prev) => prev.filter((b) => getItemId(b) !== id));
    try {
      const existing = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
      const entry = {
        externalId: item.externalId || item.title,
        title: item.title,
        thumbnail: item.poster,
        contentType: 'book',
        readAt: new Date().toISOString(),
      };
      if (!existing.some((b) => (b.externalId || b.title) === (entry.externalId || entry.title))) {
        localStorage.setItem(READ_KEY, JSON.stringify([entry, ...existing].slice(0, 100)));
      }
    } catch {}
  };

  const handlePromptChange = (value) => {
    setPrompt(value);
    setDraftMoodFromPrompt(value);
  };

  const handleToggleFavoriteAndHide = async (item, contentType) => {
    const id = getItemId(item);
    const wasFavorite = isFavorite(id);
    await toggle({
      contentType,
      externalId: id,
      title: item.title,
      thumbnail: item.poster || item.thumbnail,
    });
    if (!wasFavorite) {
      if (contentType === 'book') setBookList((prev) => prev.filter((b) => getItemId(b) !== id));
      if (contentType === 'movie') setMovieList((prev) => prev.filter((m) => getItemId(m) !== id));
      if (contentType === 'music') setMusicList((prev) => prev.filter((m) => getItemId(m) !== id));
    }
  };

  // Dynamic prompt suggestions based on the current mood colorKey
  const promptSuggestions = colorKey
    ? getPromptSuggestions(colorKey)
    : VIBE_PROMPT_EXAMPLES.slice(0, 4);
  const visibleSections = vibeData?.sections
    ? {
        music: recPrefs.showMusic ? musicList : [],
        movies: (recPrefs.showMovies || recPrefs.showSeries) ? movieList : [],
        books: recPrefs.showBooks ? bookList : [],
      }
    : null;

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
            {t('heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500 text-balance sm:text-lg">
            {t('heroSubtitle')}
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Feels like Gilmore Girls in autumn..."
              maxLength={500}
              className="input flex-1 text-base"
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn-accent text-base">
              {loading ? t('generating') : t('generate')}
            </button>
          </form>

          {/* Emotional intensity slider */}
          <div className="mt-6 flex items-center gap-4">
            <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-ink-400">
              {t('intensity')}
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
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">{t('try')}</span>
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
        {loading && <LoadingVibeState message={t('loadingVibe')} />}

        {!loading && !vibeData && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-ink-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7a7565" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink-700">
              {t('emptyTitle')}
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-400">
              {t('emptyBody')}
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

            {recPrefs.showMusic && musicList.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow={t('soundtrack')}
                  title={t('playlistTitle')}
                  caption={t('playlistCaption')}
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {musicList.slice(0, 10).map((m) => (
                    <MusicCard
                      key={m._id || m.title}
                      item={m}
                      isFavorite={isFavorite}
                      onToggleFavorite={(item) => handleToggleFavoriteAndHide(item, 'music')}
                    />
                  ))}
                </div>
              </section>
            )}

            {(recPrefs.showMovies || recPrefs.showSeries) && movieList.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow={t('watch')}
                  title={t('watchTitle')}
                  caption={t('watchCaption')}
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {movieList.slice(0, VISIBLE_MEDIA_COUNT).map((m, index) => (
                    <MovieCard
                      key={m._id || m.title}
                      item={m}
                      index={index}
                      onClick={setMovieDetail}
                      isFavorite={isFavorite}
                      onToggleFavorite={(item) => handleToggleFavoriteAndHide(item, 'movie')}
                      onWatched={dismissMovie}
                    />
                  ))}
                </div>
              </section>
            )}

            {recPrefs.showBooks && bookList.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow={t('read')}
                  title={t('readTitle')}
                  caption={t('readCaption')}
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {bookList.slice(0, VISIBLE_MEDIA_COUNT).map((b, index) => (
                    <BookCard
                      key={b._id || b.title}
                      item={b}
                      index={index}
                      onClick={setBookDetail}
                      isFavorite={isFavorite}
                      onToggleFavorite={(item) => handleToggleFavoriteAndHide(item, 'book')}
                      onRead={dismissBook}
                    />
                  ))}
                </div>
              </section>
            )}

            <MoodboardGrid sections={visibleSections} mood={vibeData.mood} />

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
          {isSaved ? t('vibeSaved') : t('saveVibe')}
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
