import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookDetailModal from '../components/BookDetailModal';
import LoadingVibeState from '../components/LoadingVibeState';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';
import { REC_PREFS_DEFAULTS, useUserPreferences } from '../context/UserPreferencesContext';
import useFavorites from '../hooks/useFavorites';
import api from '../services/api';
import { VIBE_PROMPT_EXAMPLES, getPromptSuggestions } from '../utils/constants';
import { readUserScopedJson, writeUserScopedJson } from '../utils/userStorage';
import { readVibeListsSession, writeVibeListsSession } from '../utils/vibeSession';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const RECENT_MOODS_KEY = 'moodflix.recentMoods';
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

const HeartIcon = ({ filled = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      d="M20.8 5.7c-1.8-2-4.8-2.1-6.8-.2L12 7.4 10 5.5c-2-1.9-5-1.8-6.8.2-1.9 2.1-1.7 5.4.4 7.3l7.5 7c.5.5 1.3.5 1.8 0l7.5-7c2.1-1.9 2.3-5.2.4-7.3Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M6.5 4.5h11v15L12 16.2l-5.5 3.3v-15Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
  </svg>
);

const GlassesIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M3.5 13.2c.2-2.2 1.4-3.7 3.6-3.7 2.4 0 3.8 1.6 4 3.9M12.9 13.4c.2-2.3 1.6-3.9 4-3.9 2.2 0 3.4 1.5 3.6 3.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M11.1 13.4h1.8M3.5 13.2c0 2.2 1.6 4 3.8 4s3.8-1.6 3.8-3.8M12.9 13.4c0 2.2 1.6 3.8 3.8 3.8s3.8-1.8 3.8-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const WheelEmptyState = ({ language, suggestions, loading, onPick }) => {
  const tr = language === 'tr';
  const wheelItems = [...new Set([...suggestions, ...VIBE_PROMPT_EXAMPLES])].slice(0, 6);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const selected = wheelItems[selectedIndex] || wheelItems[0];

  const spin = () => {
    if (spinning || loading || !wheelItems.length) return;
    const nextIndex = Math.floor(Math.random() * wheelItems.length);
    setSpinning(true);
    setSelectedIndex(nextIndex);
    window.setTimeout(() => {
      setSpinning(false);
      onPick(wheelItems[nextIndex]);
    }, 950);
  };

  return (
    <section className="zero-empty zero-vibe-wheel">
      <div className="vibe-wheel-stage">
        <div className="vibe-wheel-pointer" aria-hidden />
        <button
          type="button"
          className={`vibe-wheel ${spinning ? 'is-spinning' : ''}`}
          onClick={spin}
          disabled={spinning || loading}
          aria-label={tr ? 'Vibe çarkını çevir' : 'Spin the vibe wheel'}
        >
          {wheelItems.map((item, index) => (
            <span key={item} style={{ '--slice': index }}>
              <em title={item}>{index + 1}</em>
            </span>
          ))}
          <strong>{tr ? 'Çevir' : 'Spin'}</strong>
        </button>
      </div>
      <div className="vibe-wheel-copy">
        <span>{tr ? 'Vibe çarkı' : 'Vibe wheel'}</span>
        <h2>{tr ? 'Kararsızsan çevir.' : 'Spin if you are stuck.'}</h2>
        <p>{selected}</p>
        <button type="button" onClick={spin} disabled={spinning || loading}>
          {spinning ? (tr ? 'Dönüyor...' : 'Spinning...') : (tr ? 'Çarkı çevir' : 'Spin the wheel')}
        </button>
      </div>
    </section>
  );
};

const VibePage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?._id;
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
  const cinemaTracklistRef = useRef(null);
  const recPrefs = { ...REC_PREFS_DEFAULTS, ...(prefs.recPrefs || {}) };

  const getItemId = (item) => item?.externalId || item?._id || item?.title;

  const getStoredIds = (key) => {
    const stored = readUserScopedJson(key, userId, []);
    if (!Array.isArray(stored)) return new Set();
    return new Set(stored.map((item) => item.externalId || item.title).filter(Boolean));
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
    const stored = readUserScopedJson(SAVED_VIBES_KEY, userId, []);
    setSavedVibes(Array.isArray(stored) ? stored : []);
  }, [userId]);

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
  const visibleMusic = useMemo(() => shownMusic.slice(0, 10), [shownMusic]);
  const visibleMovies = useMemo(() => shownMovies.slice(0, 10), [shownMovies]);
  const visibleBooks = useMemo(() => shownBooks.slice(0, 10), [shownBooks]);
  const activeMovie = visibleMovies.find((item) => getItemId(item) === activeMovieId) || visibleMovies[0];
  const activeMovieIndex = Math.max(0, visibleMovies.findIndex((item) => getItemId(item) === getItemId(activeMovie)));
  const carouselOffsets =
    visibleMovies.length >= 5 ? [-2, -1, 0, 1, 2] :
    visibleMovies.length === 4 ? [-1, 0, 1, 2] :
    visibleMovies.length === 3 ? [-1, 0, 1] :
    visibleMovies.length === 2 ? [0, 1] :
    visibleMovies.length === 1 ? [0] : [];
  const cinemaCarouselMovies = carouselOffsets.map((offset) => {
    const index = activeMovieIndex + offset;
    return index >= 0 && index < visibleMovies.length
      ? { movie: visibleMovies[index], offset }
      : null;
  }).filter(Boolean);
  const activeMusic = visibleMusic.find((item) => getItemId(item) === activeMusicId) || visibleMusic[0];
  const activeBook = visibleBooks.find((item) => getItemId(item) === activeBookId) || visibleBooks[0];
  const activeBookCover = activeBook?.poster ||
    (activeBook?.title
      ? `https://covers.openlibrary.org/b/title/${encodeURIComponent(activeBook.title)}-L.jpg?default=false`
      : '');
  const activeBookIndex = Math.max(0, visibleBooks.findIndex((item) => getItemId(item) === getItemId(activeBook)));
  const availableScenes = [
    recPrefs.showMusic && visibleMusic.length > 0
      ? { id: 'music', label: prefs.language === 'tr' ? 'Müzik' : 'Music', kicker: 'soundtrack' }
      : null,
    (recPrefs.showMovies || recPrefs.showSeries) && visibleMovies.length > 0
      ? { id: 'cinema', label: prefs.language === 'tr' ? 'Film / Dizi' : 'Film / Series', kicker: prefs.language === 'tr' ? 'spot ışığı' : 'spotlight' }
      : null,
    recPrefs.showBooks && visibleBooks.length > 0
      ? { id: 'books', label: prefs.language === 'tr' ? 'Kitaplar' : 'Books', kicker: prefs.language === 'tr' ? 'kitaplık' : 'storybook' }
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
    if (!visibleMovies.length) {
      setActiveMovieId(null);
      return;
    }
    if (!visibleMovies.some((item) => getItemId(item) === activeMovieId)) {
      setActiveMovieId(getItemId(visibleMovies[0]));
    }
  }, [visibleMovies, activeMovieId]);

  useEffect(() => {
    if (!visibleMusic.length) {
      setActiveMusicId(null);
      return;
    }
    if (!visibleMusic.some((item) => getItemId(item) === activeMusicId)) {
      setActiveMusicId(getItemId(visibleMusic[0]));
    }
  }, [visibleMusic, activeMusicId]);

  useEffect(() => {
    if (!visibleBooks.length) {
      setActiveBookId(null);
      return;
    }
    if (!visibleBooks.some((item) => getItemId(item) === activeBookId)) {
      setActiveBookId(getItemId(visibleBooks[0]));
    }
  }, [visibleBooks, activeBookId]);

  useEffect(() => {
    if (!availableScenes.length) return;
    if (!availableScenes.some((scene) => scene.id === activeScene)) {
      setActiveScene(availableScenes[0].id);
    }
  }, [availableScenes, activeScene]);

  useEffect(() => {
    if (selectedScene !== 'cinema') return;
    if (!cinemaTracklistRef.current) return;
    cinemaTracklistRef.current.scrollTo({ left: 0, behavior: 'auto' });
  }, [selectedScene, visibleMovies.length]);

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
      const recent = readUserScopedJson(RECENT_MOODS_KEY, userId, []);
      const recentEntry = {
        id: Date.now(),
        prompt: value,
        mood: data.mood,
        savedAt: new Date().toISOString(),
      };
      const nextRecent = [
        recentEntry,
        ...(Array.isArray(recent) ? recent : []).filter((item) => item.prompt !== value),
      ].slice(0, 5);
      writeUserScopedJson(RECENT_MOODS_KEY, userId, nextRecent);
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
      writeUserScopedJson(SAVED_VIBES_KEY, userId, next);
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
    writeUserScopedJson(SAVED_VIBES_KEY, userId, next);
    toast.success('Vibe saved');
    api.post('/motivation/award', { taskId: 'save' }).catch(() => {});
  };

  const dismissMovie = (item) => {
    const id = getItemId(item);
    setMovieList((prev) => prev.filter((m) => getItemId(m) !== id));
    // Persist to watched list for Dashboard
    const existing = readUserScopedJson(WATCHED_KEY, userId, []);
    const entry = {
      externalId: item.externalId || item.title,
      title: item.title,
      thumbnail: item.poster,
      contentType: item.contentType === 'series' ? 'series' : 'movie',
      watchedAt: new Date().toISOString(),
    };
    if (!existing.some((w) => (w.externalId || w.title) === (entry.externalId || entry.title))) {
      writeUserScopedJson(WATCHED_KEY, userId, [entry, ...existing].slice(0, 100));
    }
  };

  const dismissBook = (item) => {
    const id = getItemId(item);
    setBookList((prev) => prev.filter((b) => getItemId(b) !== id));
    const existing = readUserScopedJson(READ_KEY, userId, []);
    const entry = {
      externalId: item.externalId || item.title,
      title: item.title,
      thumbnail: item.poster,
      contentType: 'book',
      readAt: new Date().toISOString(),
    };
    if (!existing.some((b) => (b.externalId || b.title) === (entry.externalId || entry.title))) {
      writeUserScopedJson(READ_KEY, userId, [entry, ...existing].slice(0, 100));
    }
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
      if (contentType === 'movie' || contentType === 'series') setMovieList((prev) => prev.filter((m) => getItemId(m) !== id));
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
    ? 'Vibeını yakala.'
    : 'Catch the vibe.';
  const musicSceneTitle = prefs.language === 'tr' ? `${moodTitle} için şarkılar` : `Songs for ${moodTitle}`;
  const cinemaSceneTitle = prefs.language === 'tr' ? `${moodTitle} perdesinde` : `On the ${moodTitle} screen`;
  const booksSceneTitle = prefs.language === 'tr' ? `${moodTitle} rafı` : `The ${moodTitle} shelf`;
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
          <div className="vibe-zero-copy mx-auto flex w-full max-w-[58rem] flex-col items-center text-center">
            <h1 className="zero-title text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.9]">{heroHeadline}</h1>

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
                placeholder={prefs.language === 'tr' ? 'Neon yağmur, kampüs crush, gece kahvesi...' : 'Neon rain, campus crush, late coffee...'}
                maxLength={500}
                className="zero-command-input"
                autoFocus
              />
              <button type="submit" disabled={loading} className="zero-command-button">
                {loading ? t('generating') : (prefs.language === 'tr' ? 'Moodu çöz' : 'Find my mood')}
              </button>
            </form>

            <div className="zero-prompt-board w-full" aria-label={t('try')}>
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

            <div className="zero-refine w-full">
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
          <WheelEmptyState
            language={prefs.language}
            suggestions={promptSuggestions}
            loading={loading}
            onPick={(value) => {
              setPrompt(value);
              handleGenerate(value);
            }}
          />
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

            {selectedScene === 'music' && recPrefs.showMusic && visibleMusic.length > 0 && (
              <section className="zero-chapter zero-music" style={{ '--mood-accent-live': accent }}>
                <header className="zero-chapter-head grid-cols-1">
                  <h2 className="whitespace-nowrap text-[clamp(2.9rem,4.7vw,5rem)] leading-[0.9]">{musicSceneTitle}</h2>
                </header>

                <div className="sound-runway">
                  <div className="sound-focus">
                    <div className="sound-disc">
                      {activeMusic?.poster && <img src={activeMusic.poster} alt="" />}
                    </div>
                    <div className="sound-focus-text">
                      <span>{String(visibleMusic.findIndex((item) => getItemId(item) === getItemId(activeMusic)) + 1).padStart(2, '0')}</span>
                      <h3 className="whitespace-nowrap text-[clamp(2.8rem,4.8vw,4.9rem)] leading-[0.84]">{activeMusic?.title}</h3>
                      <div>
                        <a href={getMusicSearch(activeMusic, 'spotify')} target="_blank" rel="noreferrer">Spotify</a>
                        <a href={getMusicSearch(activeMusic, 'apple')} target="_blank" rel="noreferrer">Apple Music</a>
                        <button
                          type="button"
                          className={`music-heart-button ${isFavorite(getItemId(activeMusic)) ? 'is-loved' : ''}`}
                          onClick={() => activeMusic && handleToggleFavoriteAndHide(activeMusic, 'music')}
                        >
                          <HeartIcon filled={isFavorite(getItemId(activeMusic))} />
                          {isFavorite(getItemId(activeMusic)) ? t('inFavorites') : t('addFavorite')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="sound-lines">
                    {visibleMusic.map((m, index) => {
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

            {selectedScene === 'cinema' && (recPrefs.showMovies || recPrefs.showSeries) && visibleMovies.length > 0 && (
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
                    {[...visibleMovies, ...visibleMovies, ...visibleMovies].map((m, i) => (
                      <span key={i}>{m.title}</span>
                    ))}
                  </div>
                  <div className="cinema-sprockets" />
                </div>

                <header className="zero-chapter-head grid-cols-1">
                  <h2>{cinemaSceneTitle}</h2>
                </header>

                {/* 3-col stage: tracklist | poster+ticket | info */}
                <div className="cinema-stage">
                  {/* Left: numbered tracklist */}
                  <div className="cinema-tracklist" ref={cinemaTracklistRef}>
                    {visibleMovies.map((movie, index) => {
                      const active = getItemId(movie) === getItemId(activeMovie);
                      return (
                        <button
                          key={movie._id || movie.title}
                          type="button"
                          className={`cinema-track ${active ? 'is-active' : ''}`}
                          onClick={() => {
                            setActiveMovieId(getItemId(movie));
                            setMovieDetail(movie);
                          }}
                        >
                          {movie.poster && <img className="cinema-track-poster" src={movie.poster} alt="" />}
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
                    <div className="cinema-screen" aria-hidden>
                      {activeMovie?.poster
                        ? <img src={activeMovie.poster} alt={activeMovie.title || ''} />
                        : <div className="cinema-screen-empty" />}
                    </div>

                    <div className="cinema-ticket">
                      <div className="cinema-ticket-stub">
                        <span>{prefs.language === 'tr' ? 'giriş' : 'admit'}</span>
                        <strong>{prefs.language === 'tr' ? 'bir' : 'one'}</strong>
                      </div>
                      <div className="cinema-ticket-body">
                        <span>{prefs.language === 'tr' ? 'şimdi sahnede' : 'now showing'}</span>
                        <strong>{activeMovie?.title}</strong>
                        {activeMovie?.genre && <em>{activeMovie.genre}</em>}
                      </div>
                      <div className="cinema-ticket-stub cinema-ticket-stub-r">
                        <span>no.</span>
                        <strong>{String(activeMovieIndex + 1).padStart(2, '0')}</strong>
                      </div>
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
                        <p>{projectedMovie.aiExplanation || projectedMovie.overview}</p>
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
                          <a href={getMovieSearch(projectedMovie, 'trailer')} target="_blank" rel="noreferrer">
                            {prefs.language === 'tr' ? 'Fragman' : 'Trailer'}
                          </a>
                          <button
                            type="button"
                            className="action-watched"
                            onClick={() => {
                              dismissMovie(projectedMovie);
                              setMovieDetail(null);
                            }}
                          >
                            <BookmarkIcon />
                            {prefs.language === 'tr' ? 'İzledim' : 'Watched'}
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
                    {[...visibleMovies, ...visibleMovies, ...visibleMovies].map((m, i) => (
                      <span key={i}>{m.title}</span>
                    ))}
                  </div>
                  <div className="cinema-sprockets" />
                </div>
              </section>
            )}

            {selectedScene === 'books' && recPrefs.showBooks && visibleBooks.length > 0 && (
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

                <header className="zero-chapter-head grid-cols-1">
                  <h2>{booksSceneTitle}</h2>
                </header>

                <div className="library-stage">
                  {/* Center: open book */}
                  <div className="library-podium">
                    <div className="library-lamp-glow" aria-hidden />
                    <div className="storybook-spread">
                      <div className="storybook-page storybook-page-main">
                        <span>{`${prefs.language === 'tr' ? 'bölüm' : 'chapter'} ${String(activeBookIndex + 1).padStart(2, '0')}`}</span>
                        <strong>{activeBook?.title}</strong>
                        <p>{activeBook?.aiExplanation || activeBook?.overview || t('readCaption')}</p>
                        <div className="storybook-actions">
                          <button type="button" className="action-read" onClick={() => activeBook && dismissBook(activeBook)}>
                            <GlassesIcon />
                            {prefs.language === 'tr' ? 'Okudum' : 'Read'}
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
                      {`volume ${String(visibleBooks.findIndex((b) => getItemId(b) === getItemId(activeBook)) + 1 || 1).padStart(2, '0')} / ${visibleBooks.length}`}
                    </span>
                    <h3 className="library-info-title">{prefs.language === 'tr' ? 'Mood rafından seç' : 'Choose from the mood shelf'}</h3>
                    <div className="library-cover-rail">
                      {visibleBooks.map((book, index) => {
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
                      <button type="button" className="action-read" onClick={() => activeBook && dismissBook(activeBook)}>
                        <GlassesIcon />
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
