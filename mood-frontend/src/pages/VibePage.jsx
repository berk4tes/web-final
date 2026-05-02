import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookDetailModal from '../components/BookDetailModal';
import LoadingVibeState from '../components/LoadingVibeState';
import { useMoodTheme } from '../context/MoodThemeContext';
import { REC_PREFS_DEFAULTS, useUserPreferences } from '../context/UserPreferencesContext';
import useFavorites from '../hooks/useFavorites';
import api from '../services/api';
import { VIBE_PROMPT_EXAMPLES, getPromptSuggestions } from '../utils/constants';
import { readVibeListsSession, writeVibeListsSession } from '../utils/vibeSession';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const WATCHED_KEY = 'moodflix.watched';
const READ_KEY = 'moodflix.readBooks';

const hasAnyRecommendationList = (lists) => (
  Array.isArray(lists?.movies) && lists.movies.length > 0
) || (
  Array.isArray(lists?.books) && lists.books.length > 0
) || (
  Array.isArray(lists?.music) && lists.music.length > 0
);

const REFINE_ACTIONS = [
  { id: 'lighter', labelKey: 'refineLighter', hint: 'similar to this, but lighter and softer' },
  { id: 'darker', labelKey: 'refineDarker', hint: 'similar to this, but darker and moodier' },
  { id: 'niche', labelKey: 'refineNiche', hint: 'more niche and less obvious' },
];

const VibePage = () => {
  const location = useLocation();
  const { vibeData, setVibe, colorKey, theme, setDraftMoodFromPrompt } = useMoodTheme();
  const { prefs, t } = useUserPreferences();
  const { favoriteMap, isFavorite, toggle } = useFavorites();

  // Input state
  const [prompt, setPrompt] = useState(() => vibeData?.prompt || '');
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [activeRefines, setActiveRefines] = useState([]);

  // UI state
  const [movieDetail, setMovieDetail] = useState(null);
  const [bookDetail, setBookDetail] = useState(null);
  const [savedVibes, setSavedVibes] = useState([]);
  const [activeMovieId, setActiveMovieId] = useState(null);
  const [activeMusicId, setActiveMusicId] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);
  const [activeScene, setActiveScene] = useState('music');
  const [scrollY, setScrollY] = useState(0);

  // Per-section lists allow dismissal without mutating context.
  const [movieList, setMovieList] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [musicList, setMusicList] = useState([]);

  // Track which vibe data is currently in the lists so we reset on new search
  const vibeIdRef = useRef(null);
  const intensityTimerRef = useRef(null);
  const generateRef = useRef(null);
  const projectionDetailKeyRef = useRef(null);
  const recPrefs = { ...REC_PREFS_DEFAULTS, ...(prefs.recPrefs || {}) };

  const getItemId = (item) => item?.externalId || item?._id || item?.title;

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
      restored = readVibeListsSession();
      if (restored?.id === id && hasAnyRecommendationList(restored)) {
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
    writeVibeListsSession(
      {
        id: vibeIdRef.current,
        movies: movieList,
        books: bookList,
        music: musicList,
      }
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

  const rawMusic = vibeData?.sections?.music || [];
  const rawMovies = vibeData?.sections?.movies || [];
  const rawBooks = vibeData?.sections?.books || [];
  const shownMusic = musicList.length ? musicList : rawMusic;
  const shownMovies = movieList.length ? movieList : rawMovies;
  const shownBooks = bookList.length ? bookList : rawBooks;
  const activeMovie = shownMovies.find((item) => getItemId(item) === activeMovieId) || shownMovies[0];
  const activeMovieIndex = Math.max(0, shownMovies.findIndex((item) => getItemId(item) === getItemId(activeMovie)));
  const carouselOffsets =
    shownMovies.length >= 5 ? [-2, -1, 0, 1, 2] :
    shownMovies.length === 4 ? [-1, 0, 1, 2] :
    shownMovies.length === 3 ? [-1, 0, 1] :
    shownMovies.length === 2 ? [0, 1] :
    shownMovies.length === 1 ? [0] : [];
  const cinemaCarouselMovies = carouselOffsets.map((offset) => {
    const index = (activeMovieIndex + offset + shownMovies.length) % shownMovies.length;
    return { movie: shownMovies[index], offset };
  });
  const activeMusic = shownMusic.find((item) => getItemId(item) === activeMusicId) || shownMusic[0];
  const activeBook = shownBooks.find((item) => getItemId(item) === activeBookId) || shownBooks[0];
  const activeBookCover = activeBook?.poster ||
    (activeBook?.title
      ? `https://covers.openlibrary.org/b/title/${encodeURIComponent(activeBook.title)}-L.jpg?default=false`
      : '');
  const activeBookIndex = Math.max(0, shownBooks.findIndex((item) => getItemId(item) === getItemId(activeBook)));
  const availableScenes = [
    recPrefs.showMusic && shownMusic.length > 0
      ? { id: 'music', label: prefs.language === 'tr' ? 'Müzik' : 'Music', kicker: 'soundtrack' }
      : null,
    (recPrefs.showMovies || recPrefs.showSeries) && shownMovies.length > 0
      ? { id: 'cinema', label: prefs.language === 'tr' ? 'Film / Dizi' : 'Film / Series', kicker: 'spotlight' }
      : null,
    recPrefs.showBooks && shownBooks.length > 0
      ? { id: 'books', label: prefs.language === 'tr' ? 'Kitaplar' : 'Books', kicker: 'storybook' }
      : null,
  ].filter(Boolean);
  const selectedScene = availableScenes.some((scene) => scene.id === activeScene)
    ? activeScene
    : availableScenes[0]?.id;
  const activeSceneIndex = Math.max(0, availableScenes.findIndex((scene) => scene.id === selectedScene));
  const goToScene = (direction) => {
    if (!availableScenes.length) return;
    const nextIndex = (activeSceneIndex + direction + availableScenes.length) % availableScenes.length;
    setActiveScene(availableScenes[nextIndex].id);
  };

  useEffect(() => {
    if (!shownMovies.length) {
      setActiveMovieId(null);
      return;
    }
    if (!shownMovies.some((item) => getItemId(item) === activeMovieId)) {
      setActiveMovieId(getItemId(shownMovies[0]));
    }
  }, [shownMovies, activeMovieId]);

  useEffect(() => {
    if (!shownMusic.length) {
      setActiveMusicId(null);
      return;
    }
    if (!shownMusic.some((item) => getItemId(item) === activeMusicId)) {
      setActiveMusicId(getItemId(shownMusic[0]));
    }
  }, [shownMusic, activeMusicId]);

  useEffect(() => {
    if (!shownBooks.length) {
      setActiveBookId(null);
      return;
    }
    if (!shownBooks.some((item) => getItemId(item) === activeBookId)) {
      setActiveBookId(getItemId(shownBooks[0]));
    }
  }, [shownBooks, activeBookId]);

  useEffect(() => {
    if (!availableScenes.length) return;
    if (!availableScenes.some((scene) => scene.id === activeScene)) {
      setActiveScene(availableScenes[0].id);
    }
  }, [availableScenes, activeScene]);

  useEffect(() => {
    if (!movieDetail?.title) return;
    const key = `${movieDetail.contentType || 'movie'}:${movieDetail.title}`;
    if (projectionDetailKeyRef.current === key) return;
    projectionDetailKeyRef.current = key;

    let cancelled = false;
    setProjectionLoading(true);
    api.get('/recommendations/tmdb/details', {
      params: {
        title: movieDetail.title,
        contentType: movieDetail.contentType || 'movie',
      },
    })
      .then(({ data }) => {
        if (cancelled) return;
        const details = data?.data?.details || {};
        setMovieDetail((prev) => (
          prev && getItemId(prev) === getItemId(movieDetail)
            ? {
                ...prev,
                ...details,
                genre: details.genre || prev.genre,
                aiExplanation: prev.aiExplanation,
              }
            : prev
        ));
        setMovieList((prev) => prev.map((movie) => (
          getItemId(movie) === getItemId(movieDetail)
            ? { ...movie, ...details, genre: details.genre || movie.genre, aiExplanation: movie.aiExplanation }
            : movie
        )));
      })
      .catch(() => {
        // Keep the projection usable even if TMDB has no match or the API key is missing.
      })
      .finally(() => {
        if (!cancelled) setProjectionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movieDetail?.title, movieDetail?.contentType]);

  useEffect(() => {
    let frame = null;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        frame = null;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleGenerate = async (overridePrompt, overrideIntensity) => {
    const value = String(overridePrompt ?? prompt).trim().slice(0, 500);
    if (value.length < 3) {
      toast.error('Write a few more words about your vibe');
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.post('/recommendations/vibe', { prompt: value });
      const payload = res?.data || res;
      if (!payload?.mood || !payload?.sections) {
        throw new Error('Recommendation API returned an unexpected response');
      }
      const data = {
        ...payload,
        prompt: value,
        sections: {
          music: Array.isArray(payload.sections.music) ? payload.sections.music : [],
          movies: Array.isArray(payload.sections.movies) ? payload.sections.movies : [],
          books: Array.isArray(payload.sections.books) ? payload.sections.books : [],
        },
      };
      setVibe(data);
      setPrompt(value);
      setTimeout(() => {
        document.getElementById('vibe-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error(err.response?.data?.message || 'Please sign in again');
        return;
      }
      const validationDetail = err.response?.data?.errors?.[0]?.msg;
      toast.error(validationDetail || err.response?.data?.message || err.message || 'Could not interpret your vibe');
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

  // Dynamic prompt suggestions based on the current mood colorKey
  const promptSuggestions = colorKey
    ? getPromptSuggestions(colorKey)
    : VIBE_PROMPT_EXAMPLES.slice(0, 4);
  const scrollFloat = Math.min(scrollY * 0.08, 72);
  const heroTilt = Math.min(scrollY * 0.015, 7);
  const accent = theme?.accent || '#7c5cff';
  const getMusicArtist = (item) => item?.artist || item?.overview || '';
  const getMusicSearch = (item, service) => {
    const query = encodeURIComponent(`${item?.title || ''} ${getMusicArtist(item)}`.trim());
    return service === 'apple'
      ? `https://music.apple.com/search?term=${query}`
      : `https://open.spotify.com/search/${query}`;
  };
  const getGoodreadsSearch = (item) => {
    const query = encodeURIComponent(`${item?.title || ''} ${item?.author || item?.overview || ''}`.trim());
    return `https://www.goodreads.com/search?q=${query}`;
  };
  const getMovieSearch = (item, service) => {
    const query = encodeURIComponent(item?.title || '');
    if (service === 'trailer') {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item?.title || ''} trailer`)}`;
    }
    return service === 'letterboxd'
      ? `https://letterboxd.com/search/${query}/`
      : `https://www.imdb.com/find/?q=${query}`;
  };
  const projectedMovie = movieDetail;
  const projectedDirectors = projectedMovie?.directors || [];
  const projectedCast = projectedMovie?.cast || [];
  const projectedProviders = projectedMovie?.providers || [];
  const projectedProviderLogos = projectedMovie?.providerLogos || [];
  const hasProjectionMetadata = projectedDirectors.length || projectedCast.length || projectedProviders.length || projectedProviderLogos.length;
  const moodTitle = vibeData?.mood?.title || (prefs.language === 'tr' ? 'bu ruh hali' : 'this mood');
  const heroHeadline = prefs.language === 'tr'
    ? 'Bugün nasıl bir sahnenin içindesin?'
    : 'What kind of scene are you in today?';
  const heroDescription = prefs.language === 'tr'
    ? 'Bir his yaz; sana uygun şarkı, film ve kitabı aynı atmosferde bulalım.'
    : 'Write one feeling; get songs, films, and books in the same atmosphere.';
  const sceneCopy = {
    music: {
      eyebrow: prefs.language === 'tr' ? 'dinlenecekler' : 'listening room',
      title: prefs.language === 'tr' ? `${moodTitle} için şarkılar` : `Songs for ${moodTitle}`,
      caption: prefs.language === 'tr'
        ? 'Bu moodun ritmini, temposunu ve arka plandaki küçük sızılarını taşıyan seçimler.'
        : 'Tracks that carry the tempo, texture, and quiet ache of this mood.',
    },
    cinema: {
      eyebrow: prefs.language === 'tr' ? 'izlenecekler' : 'screening room',
      title: prefs.language === 'tr' ? `${moodTitle} perdesinde` : `On the ${moodTitle} screen`,
      caption: prefs.language === 'tr'
        ? 'Bu hissin ışığına, gölgesine ve temposuna benzeyen film ve diziler.'
        : 'Films and series matched to the light, shadow, and pace of this feeling.',
    },
    books: {
      eyebrow: prefs.language === 'tr' ? 'okunacaklar' : 'reading room',
      title: prefs.language === 'tr' ? `${moodTitle} rafı` : `The ${moodTitle} shelf`,
      caption: prefs.language === 'tr'
        ? 'Bu ruh halinin içinde açılacak sayfalar; biraz kapak, biraz kenar notu, biraz kaçış.'
        : 'Pages to open inside this mood: part cover, part margin note, part escape.',
    },
  };
  return (
    <div className="vibe-zero-shell">
      <section className="vibe-zero-hero" style={{ '--mood-accent-live': accent }}>
        <div className="zero-ambient zero-ambient-a" aria-hidden />
        <div className="zero-ambient zero-ambient-b" aria-hidden />
        <div
          className="zero-orbit zero-orbit-a"
          style={{ transform: `translate3d(0, ${scrollFloat * -0.45}px, 0) rotate(${heroTilt}deg)` }}
          aria-hidden
        />
        <div
          className="zero-orbit zero-orbit-b"
          style={{ transform: `translate3d(0, ${scrollFloat * 0.5}px, 0) rotate(${heroTilt * -1.4}deg)` }}
          aria-hidden
        />

        <div className="vibe-zero-hero-inner">
          <div className="vibe-zero-copy">
            <h1 className="zero-title">{heroHeadline}</h1>
            <p className="zero-subtitle">{heroDescription}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate(new FormData(e.currentTarget).get('prompt'));
              }}
              className="zero-command"
            >
              <span className="zero-command-spark" aria-hidden />
              <input
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                name="prompt"
                placeholder={prefs.language === 'tr' ? 'Gece sineması, neon yağmur, hafif kalp kırıklığı...' : 'Late-night cinema, neon rain, soft heartbreak...'}
                maxLength={500}
                className="zero-command-input"
                autoFocus
              />
              <button type="submit" disabled={loading} className="zero-command-button">
                {loading ? t('generating') : (prefs.language === 'tr' ? 'Moodu çöz' : 'Find my mood')}
              </button>
            </form>

            <div className="zero-prompt-board" aria-label={t('try')}>
              <span>{prefs.language === 'tr' ? 'Şu modda mısın?' : 'Are you in this mood?'}</span>
              <div className="zero-prompts">
                {promptSuggestions.map((ex, index) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleGenerate(ex)}
                    disabled={loading}
                    className="zero-prompt"
                  >
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="zero-refine">
              <button
                type="button"
                onClick={() => setRefineOpen((value) => !value)}
                className="zero-refine-toggle"
              >
                <span>{t('instantFilter')}</span>
                <span>{activeRefines.length ? `${activeRefines.length} ${t('filterOn')}` : t('filterOff')}</span>
              </button>

              {refineOpen && (
                <div className="zero-refine-panel">
                  {REFINE_ACTIONS.map((action) => {
                    const active = activeRefines.includes(action.id);
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => toggleRefine(action.id)}
                        className={active ? 'is-active' : ''}
                      >
                        {t(action.labelKey)}
                      </button>
                    );
                  })}
                  <div className="zero-intensity">
                    <div className="zero-intensity-head">
                      <span>{t('intensity')}</span>
                      <strong>{intensity}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={intensity}
                      onChange={(e) => handleIntensityChange(Number(e.target.value))}
                      className="zero-range"
                      style={{ accentColor: accent }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyRefines}
                    disabled={!activeRefines.length || loading}
                    className="zero-refine-apply"
                  >
                    {t('applyFilter')}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      <div id="vibe-results" className="vibe-zero-results">
        {loading && <LoadingVibeState message={t('loadingVibe')} />}

        {!loading && !vibeData && (
          <section className="zero-empty">
            <span>01</span>
            <h2>{t('emptyTitle')}</h2>
            <p>{t('emptyBody')}</p>
          </section>
        )}

        {vibeData && !loading && (
          <>
            <section className="zero-manifesto" style={{ '--mood-accent-live': accent }}>
              <div className="mood-orbital-card">
                <div className="mood-orbital-ring" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mood-orbital-copy">
                  <span className="zero-index">{prefs.language === 'tr' ? 'mood çözüldü' : 'mood decoded'}</span>
                  <h2>{vibeData.mood?.title}</h2>
                  <p>{vibeData.mood?.description || vibeData.prompt}</p>
                </div>
                <div className="zero-manifesto-actions">
                  <div className="mood-tag-board">
                    {(vibeData.mood?.tags || []).slice(0, 5).map((tag, index) => (
                      <span key={tag} style={{ '--tag-index': index }}>
                        <em>{String(index + 1).padStart(2, '0')}</em>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={handleSaveVibe} className="action-bookmark">
                    {isSaved ? t('vibeSaved') : t('saveVibe')}
                  </button>
                </div>
              </div>
            </section>

            {availableScenes.length > 0 && (
              <section
                className="scene-switcher"
                style={{ '--mood-accent-live': accent }}
                aria-label={prefs.language === 'tr' ? 'Öneri sahneleri' : 'Recommendation scenes'}
              >
                <button
                  type="button"
                  className="scene-arrow scene-arrow-prev"
                  onClick={() => goToScene(-1)}
                  aria-label={prefs.language === 'tr' ? 'Önceki sahne' : 'Previous scene'}
                />
                <div className="scene-tabs">
                  {availableScenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      type="button"
                      className={`scene-tab ${selectedScene === scene.id ? 'is-active' : ''}`}
                      onClick={() => setActiveScene(scene.id)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{scene.label}</strong>
                      <em>{scene.kicker}</em>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="scene-arrow scene-arrow-next"
                  onClick={() => goToScene(1)}
                  aria-label={prefs.language === 'tr' ? 'Sonraki sahne' : 'Next scene'}
                />
              </section>
            )}

            {selectedScene === 'music' && recPrefs.showMusic && shownMusic.length > 0 && (
              <section className="zero-chapter zero-music" style={{ '--mood-accent-live': accent }}>
                <header className="zero-chapter-head">
                  <span>{sceneCopy.music.eyebrow}</span>
                  <h2>{sceneCopy.music.title}</h2>
                  <p>{sceneCopy.music.caption}</p>
                </header>

                <div className="sound-runway">
                  <div className="sound-focus">
                    <div className="sound-disc">
                      {activeMusic?.poster && <img src={activeMusic.poster} alt="" />}
                    </div>
                    <div className="sound-focus-text">
                      <span>{String(shownMusic.findIndex((item) => getItemId(item) === getItemId(activeMusic)) + 1).padStart(2, '0')}</span>
                      <h3>{activeMusic?.title}</h3>
                      <p>{activeMusic?.aiExplanation || getMusicArtist(activeMusic) || t('playlistCaption')}</p>
                      <div>
                        <a href={getMusicSearch(activeMusic, 'spotify')} target="_blank" rel="noreferrer">Spotify</a>
                        <a href={getMusicSearch(activeMusic, 'apple')} target="_blank" rel="noreferrer">Apple Music</a>
                        <button type="button" className="action-favorite" onClick={() => activeMusic && handleToggleFavoriteAndHide(activeMusic, 'music')}>
                          {isFavorite(getItemId(activeMusic)) ? t('inFavorites') : t('addFavorite')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="sound-lines">
                    {shownMusic.slice(0, 10).map((m, index) => {
                      const active = getItemId(m) === getItemId(activeMusic);
                      return (
                        <button
                          key={m._id || m.title}
                          type="button"
                          onClick={() => setActiveMusicId(getItemId(m))}
                          className={`sound-line ${active ? 'is-active' : ''}`}
                        >
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <strong>{m.title}</strong>
                          <em>{getMusicArtist(m)}</em>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {selectedScene === 'cinema' && (recPrefs.showMovies || recPrefs.showSeries) && shownMovies.length > 0 && (
              <section className="zero-chapter zero-cinema" style={{ '--mood-accent-live': accent }}>
                {/* Atmosphere: spotlights, projector, curtains, popcorn */}
                <div className="cinema-atmosphere" aria-hidden>
                  <div className="cinema-spotlight cinema-spotlight-left" />
                  <div className="cinema-spotlight cinema-spotlight-right" />
                  <div className="cinema-curtain cinema-curtain-left" />
                  <div className="cinema-curtain cinema-curtain-right" />
                  <div className="cinema-projector"><span /><span /></div>
                  <div className="popcorn-rain">
                    {Array.from({ length: 14 }).map((_, index) => (
                      <span key={index} style={{ '--i': index }} />
                    ))}
                  </div>
                </div>

                {/* Film strip top */}
                <div className="cinema-film-strip" aria-hidden>
                  <div className="cinema-sprockets" />
                  <div className="cinema-film-ticker">
                    {[...shownMovies, ...shownMovies, ...shownMovies].map((m, i) => (
                      <span key={i}>{m.title}</span>
                    ))}
                  </div>
                  <div className="cinema-sprockets" />
                </div>

                <header className="zero-chapter-head">
                  <span>{sceneCopy.cinema.eyebrow}</span>
                  <h2>{sceneCopy.cinema.title}</h2>
                  <p>{sceneCopy.cinema.caption}</p>
                </header>

                {/* 3-col stage: tracklist | poster+ticket | info */}
                <div className="cinema-stage">
                  {/* Left: numbered tracklist */}
                  <div className="cinema-tracklist">
                    {shownMovies.slice(0, 8).map((movie, index) => {
                      const active = getItemId(movie) === getItemId(activeMovie);
                      return (
                        <button
                          key={movie._id || movie.title}
                          type="button"
                          className={`cinema-track ${active ? 'is-active' : ''}`}
                          onClick={() => setActiveMovieId(getItemId(movie))}
                        >
                          <span className="cinema-track-num">{String(index + 1).padStart(2, '0')}</span>
                          <span className="cinema-track-name">{movie.title}</span>
                          {movie.genre && <span className="cinema-track-tag">{movie.genre}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Center: dramatic poster + golden ticket */}
                  <div className="cinema-podium">
                    <div className="cinema-podium-glow" aria-hidden />
                    <div className="cinema-card-carousel" aria-hidden>
                      {cinemaCarouselMovies.map(({ movie, offset }, index) => {
                        return (
                          <span
                            key={`${movie.title}-${index}`}
                            style={{ '--offset': offset, '--distance': Math.abs(offset), '--z': 5 - Math.abs(offset) }}
                          >
                            {movie.poster && <img src={movie.poster} alt="" />}
                          </span>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="cinema-screen"
                      onClick={() => activeMovie && setMovieDetail(activeMovie)}
                    >
                      {activeMovie?.poster
                        ? <img src={activeMovie.poster} alt={activeMovie.title || ''} />
                        : <div className="cinema-screen-empty" />}
                      <span className="cinema-screen-enter">
                        {prefs.language === 'tr' ? 'Sahneye gir' : 'Enter scene'}
                      </span>
                    </button>

                    <div className="cinema-ticket">
                      <div className="cinema-ticket-stub">
                        <span>admit</span>
                        <strong>one</strong>
                      </div>
                      <div className="cinema-ticket-body">
                        <span>now showing</span>
                        <strong>{activeMovie?.title}</strong>
                        {activeMovie?.genre && <em>{activeMovie.genre}</em>}
                      </div>
                      <div className="cinema-ticket-stub cinema-ticket-stub-r">
                        <span>no.</span>
                        <strong>{String(activeMovieIndex + 1).padStart(2, '0')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: info + actions */}
                  <div className="cinema-info">
                    <span className="cinema-info-eyebrow">
                      spotlight {String(activeMovieIndex + 1).padStart(2, '0')} / {shownMovies.length}
                    </span>
                    <h3 className="cinema-info-title">{activeMovie?.title}</h3>
                    {activeMovie?.genre && <p className="cinema-info-genre">{activeMovie.genre}</p>}
                    <p className="cinema-info-desc">{activeMovie?.aiExplanation || activeMovie?.overview}</p>
                    <div className="cinema-info-actions">
                      <a
                        className="action-detail"
                        href={getMovieSearch(activeMovie, 'trailer')}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Trailer
                      </a>
                      <button type="button" className="action-favorite" onClick={() => activeMovie && handleToggleFavoriteAndHide(activeMovie, 'movie')}>
                        {isFavorite(getItemId(activeMovie)) ? t('inFavorites') : t('addFavorite')}
                      </button>
                      <button type="button" className="action-bookmark" onClick={() => activeMovie && dismissMovie(activeMovie)}>
                        {prefs.language === 'tr' ? 'İzledim' : 'Watched'}
                      </button>
                    </div>
                  </div>
                </div>

                {projectedMovie && (
                  <div className="cinema-projection" aria-live="polite">
                    <div className="cinema-projection-beam" aria-hidden />
                    <div className="cinema-projection-screen">
                      <button
                        type="button"
                        className="cinema-projection-close"
                        onClick={() => setMovieDetail(null)}
                        aria-label={prefs.language === 'tr' ? 'Projeksiyonu kapat' : 'Close projection'}
                      />
                      <div className="cinema-projection-poster">
                        {projectedMovie.poster && <img src={projectedMovie.poster} alt="" />}
                      </div>
                      <div className="cinema-projection-copy">
                        <span className="cinema-projection-kicker">
                          {prefs.language === 'tr' ? 'perdeye yansıyan seçim' : 'projected pick'}
                        </span>
                        <h3>{projectedMovie.title}</h3>
                        <p>{projectedMovie.aiExplanation || projectedMovie.overview || sceneCopy.cinema.caption}</p>
                        <div className="cinema-projection-stats">
                          {projectedMovie.rating && <span>IMDb {projectedMovie.rating}</span>}
                          {projectedMovie.runtime && <span>{projectedMovie.runtime} min</span>}
                          {projectedMovie.releaseYear && <span>{projectedMovie.releaseYear}</span>}
                          {projectedMovie.genre && <span>{projectedMovie.genre}</span>}
                        </div>
                      </div>
                      <div className="cinema-projection-details">
                        {projectedDirectors.length > 0 && (
                          <div>
                            <span>{prefs.language === 'tr' ? 'Yönetmen' : 'Director'}</span>
                            <strong>{projectedDirectors.join(', ')}</strong>
                          </div>
                        )}
                        {projectedCast.length > 0 && (
                          <div>
                            <span>{prefs.language === 'tr' ? 'Oyuncular' : 'Cast'}</span>
                            <strong>{projectedCast.slice(0, 4).join(', ')}</strong>
                          </div>
                        )}
                        {projectedProviders.length > 0 && (
                          <div>
                            <span>{prefs.language === 'tr' ? 'Nerede var?' : 'Where to watch'}</span>
                            {projectedProviderLogos.length > 0 ? (
                              <div className="cinema-provider-logos">
                                {projectedProviderLogos.slice(0, 5).map((provider) => (
                                  <a
                                    key={provider.name}
                                    href={provider.link || getMovieSearch(projectedMovie, 'imdb')}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`${provider.name}${provider.type ? ` (${provider.type})` : ''}`}
                                    aria-label={provider.name}
                                  >
                                    {provider.logo ? <img src={provider.logo} alt="" /> : <em>{provider.name}</em>}
                                    {provider.type && <span>{provider.type}</span>}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <strong>{projectedProviders.slice(0, 4).join(', ')}</strong>
                            )}
                          </div>
                        )}
                        {(projectionLoading || !hasProjectionMetadata) && (
                          <div className="cinema-projection-note">
                            {projectionLoading
                              ? (prefs.language === 'tr' ? 'TMDB detayları perdeye yükleniyor...' : 'Loading TMDB details onto the screen...')
                              : prefs.language === 'tr'
                              ? 'TMDB bu başlık için oyuncu, yönetmen veya platform bilgisini döndürmedi.'
                              : 'TMDB did not return cast, director, or provider details for this title.'}
                          </div>
                        )}
                        <div className="cinema-projection-links">
                          <a href={getMovieSearch(projectedMovie, 'imdb')} target="_blank" rel="noreferrer">IMDb</a>
                          <a href={getMovieSearch(projectedMovie, 'letterboxd')} target="_blank" rel="noreferrer">Letterboxd</a>
                          <button type="button" className="action-favorite" onClick={() => handleToggleFavoriteAndHide(projectedMovie, 'movie')}>
                            {isFavorite(getItemId(projectedMovie)) ? t('inFavorites') : t('addFavorite')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Film strip bottom */}
                <div className="cinema-film-strip" aria-hidden>
                  <div className="cinema-sprockets" />
                  <div className="cinema-film-ticker cinema-film-ticker-rev">
                    {[...shownMovies, ...shownMovies, ...shownMovies].map((m, i) => (
                      <span key={i}>{m.title}</span>
                    ))}
                  </div>
                  <div className="cinema-sprockets" />
                </div>
              </section>
            )}

            {selectedScene === 'books' && recPrefs.showBooks && shownBooks.length > 0 && (
              <section className="zero-chapter zero-books" style={{ '--mood-accent-live': accent }}>
                {/* Reading room atmosphere */}
                <div className="library-atmosphere" aria-hidden>
                  <div className="library-lamp-beam" />
                  <div className="library-dust">
                    {Array.from({ length: 14 }).map((_, index) => (
                      <span key={index} style={{ '--i': index }} />
                    ))}
                  </div>
                </div>

                <div className="library-shelf" aria-hidden />

                <header className="zero-chapter-head">
                  <span>{sceneCopy.books.eyebrow}</span>
                  <h2>{sceneCopy.books.title}</h2>
                  <p>{sceneCopy.books.caption}</p>
                </header>

                <div className="library-stage">
                  {/* Center: open book */}
                  <div className="library-podium">
                    <div className="library-lamp-glow" aria-hidden />
                    <div className="storybook-spread">
                      <div className="storybook-page storybook-page-main">
                        <span>{`chapter ${String(activeBookIndex + 1).padStart(2, '0')}`}</span>
                        <strong>{activeBook?.title}</strong>
                        <p>{activeBook?.aiExplanation || activeBook?.overview || t('readCaption')}</p>
                        <div className="storybook-actions">
                          <button type="button" className="action-favorite" onClick={() => activeBook && handleToggleFavoriteAndHide(activeBook, 'book')}>
                            {isFavorite(getItemId(activeBook)) ? t('inFavorites') : t('saveToLibrary')}
                          </button>
                          <a className="action-detail" href={getGoodreadsSearch(activeBook)} target="_blank" rel="noreferrer">
                            Goodreads
                          </a>
                        </div>
                      </div>
                      <div className="storybook-page storybook-page-cover">
                        <span>{prefs.language === 'tr' ? 'kapak sayfası' : 'cover page'}</span>
                        <button type="button" className="storybook-cover-button" onClick={() => activeBook && setBookDetail(activeBook)}>
                          {activeBookCover
                            ? <img src={activeBookCover} alt={activeBook?.title || ''} />
                            : <div className="library-cover-empty" />}
                        </button>
                        <em>{activeBook?.overview || activeBook?.author || moodTitle}</em>
                      </div>
                    </div>
                  </div>

                  {/* Right: shelf notes */}
                  <div className="library-info">
                    <span className="library-info-eyebrow">
                      {`volume ${String(shownBooks.findIndex((b) => getItemId(b) === getItemId(activeBook)) + 1 || 1).padStart(2, '0')} / ${shownBooks.length}`}
                    </span>
                    <h3 className="library-info-title">{prefs.language === 'tr' ? 'Mood rafından seç' : 'Choose from the mood shelf'}</h3>
                    <div className="library-cover-rail">
                      {shownBooks.slice(0, 10).map((book, index) => {
                        const cover = book.poster ||
                          (book.title ? `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-L.jpg?default=false` : '');
                        const active = getItemId(book) === getItemId(activeBook);
                        return (
                          <button
                            key={book._id || book.title}
                            type="button"
                            className={active ? 'is-active' : ''}
                            onClick={() => setActiveBookId(getItemId(book))}
                            style={{ '--i': index }}
                          >
                            {cover && <img src={cover} alt={book.title} />}
                            <span>{book.title}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="library-info-actions">
                      <button type="button" className="action-bookmark" onClick={() => activeBook && dismissBook(activeBook)}>
                        {prefs.language === 'tr' ? 'Okudum' : 'Read'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="library-shelf" aria-hidden />
              </section>
            )}
          </>
        )}
      </div>

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
