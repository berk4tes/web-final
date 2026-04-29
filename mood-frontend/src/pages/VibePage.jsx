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
import { VIBE_PROMPT_EXAMPLES, getPromptSuggestions } from '../utils/constants';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const WATCHED_KEY = 'moodflix.watched';
const READ_KEY = 'moodflix.readBooks';
const VIBE_LISTS_KEY = 'moodflix.currentVibeLists';
const VISIBLE_MEDIA_COUNT = 5;

const REFINE_ACTIONS = [
  { id: 'lighter', labelKey: 'refineLighter', hint: 'similar to this, but lighter and softer' },
  { id: 'darker', labelKey: 'refineDarker', hint: 'similar to this, but darker and moodier' },
  { id: 'niche', labelKey: 'refineNiche', hint: 'more niche and less obvious' },
];

const ChevronIcon = ({ open }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform ${open ? 'rotate-180' : ''}`}
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
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
  const [refineOpen, setRefineOpen] = useState(false);
  const [activeRefines, setActiveRefines] = useState([]);
  const [openSections, setOpenSections] = useState({ music: true, movies: true, books: true });

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

  const filterAlreadyCollected = (items, extraKey, includeFavorites = true) => {
    const favorites = new Set(Object.keys(favoriteMap || {}));
    const extra = extraKey ? getStoredIds(extraKey) : new Set();
    return (items || []).filter((item) => {
      const id = getItemId(item);
      return id && (!includeFavorites || !favorites.has(id)) && !extra.has(id);
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
        setMusicList(filterAlreadyCollected(restored.music || [], null, false));
      } else {
        setMovieList(filterAlreadyCollected(vibeData.sections?.movies, WATCHED_KEY));
        setBookList(filterAlreadyCollected(vibeData.sections?.books, READ_KEY));
        setMusicList(filterAlreadyCollected(vibeData.sections?.music, null, false));
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
    setMusicList((prev) => filterAlreadyCollected(prev, null, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteMap]);

  const isSaved = useMemo(() => {
    if (!vibeData) return false;
    return savedVibes.some(
      (v) => v.prompt === vibeData.prompt && v.mood?.title === vibeData.mood?.title
    );
  }, [vibeData, savedVibes]);

  const shownMusic = musicList;
  const shownMovies = movieList;
  const shownBooks = bookList;

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
        ...REFINE_ACTIONS
          .filter((action) => activeRefines.includes(action.id))
          .map((action) => action.hint),
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
    }
  };

  const toggleRefine = (id) => {
    setActiveRefines((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const applyRefines = () => {
    const base = (vibeData?.prompt || prompt).trim();
    if (!base) return;
    handleGenerate(base);
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Dynamic prompt suggestions based on the current mood colorKey
  const promptSuggestions = colorKey
    ? getPromptSuggestions(colorKey)
    : VIBE_PROMPT_EXAMPLES.slice(0, 4);
  const visibleSections = vibeData?.sections
    ? {
        music: recPrefs.showMusic ? shownMusic : [],
        movies: (recPrefs.showMovies || recPrefs.showSeries) ? shownMovies : [],
        books: recPrefs.showBooks ? shownBooks : [],
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      {/* Hero input composer */}
      <section className="relative min-h-[calc(100vh-96px)] overflow-hidden py-8 sm:py-12 lg:py-16">
        <div
          className="pointer-events-none absolute left-1/2 top-8 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700 sm:h-[28rem] sm:w-[28rem]"
          style={{ backgroundColor: theme ? `${theme.accent}2f` : 'rgba(124,92,255,0.16)' }}
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[72vh] max-w-4xl flex-col items-center justify-center text-center">
          <span className="section-eyebrow">{t('moodFirst')}</span>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.98] tracking-tight text-ink-700 text-balance sm:text-7xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 text-balance sm:text-lg">
            {t('heroSubtitle')}
          </p>

          <div className="relative mood-console mt-10 w-full min-w-0 text-left">
            <div className="pointer-events-none absolute -inset-5 rounded-[2.2rem] border border-white/35 opacity-70" />
            <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: theme?.accent || '#7c5cff' }} />
            <form
              onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
              className="relative rounded-[2rem] border border-white/50 bg-white/70 p-3 shadow-soft backdrop-blur-xl sm:p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder="Feels like Gilmore Girls in autumn..."
                  maxLength={500}
                  className="input mood-hero-input min-h-14 flex-1 text-base shadow-none"
                  autoFocus
                />
                <button type="submit" disabled={loading} className="btn-accent min-h-12 shrink-0 px-7 text-base">
                  {loading ? t('generating') : t('generate')}
                </button>
              </div>
            </form>

            {/* Emotional intensity slider */}
            <div className="relative mt-4 rounded-[1.6rem] border border-white/45 bg-white/40 p-4 backdrop-blur">
              <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-ink-400">
                      {t('intensity')}
                    </span>
                    <span
                      className="rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold tabular-nums"
                      style={{ color: theme ? theme.accent : '#7c5cff' }}
                    >
                      {intensity}/10
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: `linear-gradient(90deg, transparent, ${theme?.accent || '#7c5cff'}, transparent)` }} />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={intensity}
                      onChange={(e) => handleIntensityChange(Number(e.target.value))}
                      className="relative h-2 w-full cursor-pointer rounded-full accent-accent"
                      style={theme ? { accentColor: theme.accent } : {}}
                    />
                  </div>
                </div>

                {/* Prompt suggestions - dynamic based on current mood */}
                <div className="min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wider text-ink-400">{t('try')}</span>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pr-1 sm:flex-wrap sm:overflow-visible">
                    {promptSuggestions.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => handleGenerate(ex)}
                        disabled={loading}
                        className="shrink-0 rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-xs font-medium text-ink-600 backdrop-blur transition hover:border-accent hover:text-accent-ink disabled:opacity-50 sm:shrink"
                        style={{ '--tw-ring-color': theme?.accent }}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setRefineOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white/60 px-4 py-3 text-left text-sm font-semibold text-ink-700 backdrop-blur transition hover:border-accent/40"
              >
                <span>{t('instantFilter')}</span>
                <span className="shrink-0 text-xs font-medium text-ink-400">
                  {activeRefines.length ? `${activeRefines.length} ${t('filterOn')}` : t('filterOff')}
                </span>
              </button>

              {refineOpen && (
                <div className="mt-3 rounded-2xl border border-ink-100 bg-white/70 p-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                    {REFINE_ACTIONS.map((action) => {
                      const active = activeRefines.includes(action.id);
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => toggleRefine(action.id)}
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:shrink ${
                            active ? 'border-accent bg-accent/10 text-accent-ink' : 'border-ink-200 bg-white text-ink-500 hover:border-accent'
                          }`}
                        >
                          {t(action.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={applyRefines}
                    disabled={!activeRefines.length || loading}
                    className="btn-secondary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('applyFilter')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results area */}
      <div id="vibe-results" className="mt-10 space-y-10 sm:mt-12">
        {loading && <LoadingVibeState message={t('loadingVibe')} />}

        {!loading && !vibeData && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-white/70 flex items-center justify-center shadow-soft">
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
              mood={vibeData.mood}
              onSave={handleSaveVibe}
              isSaved={isSaved}
            />

            {recPrefs.showMusic && shownMusic.length > 0 && (
              <section className="mood-playlist animate-slide-up overflow-hidden rounded-[2rem] border border-white/45 bg-ink-800 p-4 text-white shadow-soft sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{t('soundtrack')}</span>
                    <h2 className="mt-2 font-display text-3xl font-semibold">{t('playlistTitle')}</h2>
                    <p className="mt-1 max-w-xl text-sm text-white/55">{t('playlistCaption')}</p>
                  </div>
                  <button type="button" onClick={() => toggleSection('music')} className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
                    <span className="sr-only">{openSections.music ? t('closePlaylist') : t('openPlaylist')}</span>
                    <span aria-hidden="true">{shownMusic.length}</span>
                    <ChevronIcon open={openSections.music} />
                  </button>
                </div>

                {openSections.music && (
                  <div className="mt-5 grid gap-3 lg:grid-cols-[280px_1fr]">
                    <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-white/10">
                      <img
                        src={shownMusic[0]?.poster}
                        alt=""
                        className="h-full w-full object-cover opacity-70"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{t('moodQueue')}</span>
                        <p className="mt-2 font-display text-2xl font-semibold leading-tight">{vibeData.mood?.title}</p>
                      </div>
                    </div>
                    <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                      {shownMusic.slice(0, 10).map((m, index) => (
                        <div key={m._id || m.title} className="grid grid-cols-[32px_1fr] items-center gap-2">
                          <span className="text-right text-xs font-semibold text-white/35">{String(index + 1).padStart(2, '0')}</span>
                          <MusicCard
                            item={m}
                            isFavorite={isFavorite}
                            onToggleFavorite={(item) => handleToggleFavoriteAndHide(item, 'music')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {(recPrefs.showMovies || recPrefs.showSeries) && shownMovies.length > 0 && (
              <section className="mood-cinema animate-slide-up overflow-hidden rounded-[2rem] border border-white/45 p-4 shadow-soft sm:p-5">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{t('watch')}</span>
                    <h2 className="mt-2 font-display text-3xl font-semibold text-white">{t('watchTitle')}</h2>
                    <p className="mt-1 max-w-xl text-sm text-white/55">{t('watchCaption')}</p>
                  </div>
                  <button type="button" onClick={() => toggleSection('movies')} className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
                    <span className="sr-only">{openSections.movies ? t('closeStrip') : t('openStrip')}</span>
                    <ChevronIcon open={openSections.movies} />
                  </button>
                </div>
                {openSections.movies && (
                  <div className="cinema-strip -mx-4 overflow-x-auto px-4 pb-6">
                    <div className="flex min-w-max gap-5">
                      {shownMovies.slice(0, VISIBLE_MEDIA_COUNT).map((m, index) => (
                        <div key={m._id || m.title} className="w-44 flex-shrink-0 sm:w-52">
                          <MovieCard
                            item={m}
                            index={index}
                            onClick={setMovieDetail}
                            isFavorite={isFavorite}
                            onToggleFavorite={(item) => handleToggleFavoriteAndHide(item, 'movie')}
                            onWatched={dismissMovie}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {recPrefs.showBooks && shownBooks.length > 0 && (
              <section className="animate-slide-up py-3">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <SectionHeader eyebrow={t('read')} title={t('readTitle')} caption={t('readCaption')} />
                  <button type="button" onClick={() => toggleSection('books')} className="btn-pill">
                    <span className="sr-only">{openSections.books ? t('closeShelf') : t('openShelf')}</span>
                    <ChevronIcon open={openSections.books} />
                  </button>
                </div>
                {openSections.books && (
                  <div className="book-shelf overflow-hidden rounded-[2rem] border border-ink-100/70 px-4 pb-6 pt-6">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                      {shownBooks.slice(0, VISIBLE_MEDIA_COUNT).map((b, index) => (
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
                  </div>
                )}
              </section>
            )}

            <MoodboardGrid
              sections={visibleSections}
              mood={vibeData.mood}
            />

          </>
        )}
      </div>

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
