import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookDetailModal from '../components/BookDetailModal';
import CircularGallery from '../components/CircularGallery';
import LoadingVibeState from '../components/LoadingVibeState';
import FilmDetailModal from '../components/FilmDetailModal';
import { useMoodTheme } from '../context/MoodThemeContext';
import { REC_PREFS_DEFAULTS, useUserPreferences } from '../context/UserPreferencesContext';
import useFavorites from '../hooks/useFavorites';
import api from '../services/api';
import { VIBE_PROMPT_EXAMPLES, getPromptSuggestions } from '../utils/constants';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';
const WATCHED_KEY = 'moodflix.watched';
const READ_KEY = 'moodflix.readBooks';
const VIBE_LISTS_KEY = 'moodflix.currentVibeLists';

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
  const [refineOpen, setRefineOpen] = useState(false);
  const [activeRefines, setActiveRefines] = useState([]);

  // UI state
  const [movieDetail, setMovieDetail] = useState(null);
  const [bookDetail, setBookDetail] = useState(null);
  const [savedVibes, setSavedVibes] = useState([]);
  const [activeMovieId, setActiveMovieId] = useState(null);
  const [activeMusicId, setActiveMusicId] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  // Per-section lists allow dismissal without mutating context.
  const [movieList, setMovieList] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [musicList, setMusicList] = useState([]);

  // Track which vibe data is currently in the lists so we reset on new search
  const vibeIdRef = useRef(null);
  const intensityTimerRef = useRef(null);
  const generateRef = useRef(null);
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
  const activeMovie = shownMovies.find((item) => getItemId(item) === activeMovieId) || shownMovies[0];
  const activeMovieIndex = Math.max(0, shownMovies.findIndex((item) => getItemId(item) === getItemId(activeMovie)));
  const activeMusic = shownMusic.find((item) => getItemId(item) === activeMusicId) || shownMusic[0];
  const activeBook = shownBooks.find((item) => getItemId(item) === activeBookId) || shownBooks[0];
  const activeBookCover = activeBook?.poster ||
    (activeBook?.title
      ? `https://covers.openlibrary.org/b/title/${encodeURIComponent(activeBook.title)}-L.jpg?default=false`
      : '');
  const heroFeature = activeMovie || activeBook || shownMusic[0];
  const heroVisual = heroFeature?.poster || activeBookCover || shownMusic[0]?.poster;

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
  const movieGalleryItems = shownMovies.slice(0, 10).filter((item) => item.poster).map((item) => ({
    image: item.poster,
    text: item.title,
  }));

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
            <span className="zero-kicker">{t('moodFirst')}</span>
            <h1 className="zero-title">{t('heroTitle')}</h1>
            <p className="zero-subtitle">{t('heroSubtitle')}</p>

            <form
              onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
              className="zero-command"
            >
              <input
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="Feels like late-night cinema, neon rain, soft heartbreak..."
                maxLength={500}
                className="zero-command-input"
                autoFocus
              />
              <button type="submit" disabled={loading} className="zero-command-button">
                {loading ? t('generating') : t('generate')}
              </button>
            </form>

            <div className="zero-control-flow">
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

              <div className="zero-prompts" aria-label={t('try')}>
                {promptSuggestions.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleGenerate(ex)}
                    disabled={loading}
                    className="zero-prompt"
                  >
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

          <div className="zero-stage" aria-label="Mood preview">
            <div className="zero-stage-copy">
              <span>{heroFeature?.contentType || vibeData?.mood?.label || 'mood signal'}</span>
              <strong>{heroFeature?.title || vibeData?.mood?.title || 'MoodFlix'}</strong>
              <p>{heroFeature?.aiExplanation || heroFeature?.overview || t('watchCaption')}</p>
            </div>
            <div className="zero-poster zero-poster-back">
              {shownMovies[1]?.poster && <img src={shownMovies[1].poster} alt="" />}
            </div>
            <div className="zero-poster zero-poster-mid">
              {shownBooks[0]?.poster && <img src={shownBooks[0].poster} alt="" />}
            </div>
            <div className="zero-poster zero-poster-front">
              {heroVisual && <img src={heroVisual} alt={heroFeature?.title || ''} />}
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
              <span className="zero-index">mood decoded</span>
              <h2>{vibeData.mood?.title}</h2>
              <p>{vibeData.mood?.description || vibeData.prompt}</p>
              <div className="zero-manifesto-actions">
                {(vibeData.mood?.tags || []).slice(0, 5).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
                <button type="button" onClick={handleSaveVibe}>
                  {isSaved ? t('vibeSaved') : t('saveVibe')}
                </button>
              </div>
            </section>

            {recPrefs.showMusic && shownMusic.length > 0 && (
              <section className="zero-chapter zero-music" style={{ '--mood-accent-live': accent }}>
                <header className="zero-chapter-head">
                  <span>soundtrack</span>
                  <h2>{t('playlistTitle')}</h2>
                  <p>{t('playlistCaption')}</p>
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
                        <button type="button" onClick={() => activeMusic && handleToggleFavoriteAndHide(activeMusic, 'music')}>
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

            {(recPrefs.showMovies || recPrefs.showSeries) && shownMovies.length > 0 && (
              <section className="zero-chapter zero-cinema" style={{ '--mood-accent-live': accent }}>
                <header className="zero-chapter-head">
                  <span>{t('watch')}</span>
                  <h2>{t('watchTitle')}</h2>
                  <p>{t('watchCaption')}</p>
                </header>

                <div className="cinema-runway">
                  <div className="cinema-runway-copy">
                    <span>{String(activeMovieIndex + 1).padStart(2, '0')} / {shownMovies.length}</span>
                    <h3>{activeMovie?.title}</h3>
                    <p>{activeMovie?.aiExplanation || activeMovie?.overview}</p>
                    <div>
                      {activeMovie?.genre && <em>{activeMovie.genre}</em>}
                      <button type="button" onClick={() => activeMovie && setMovieDetail(activeMovie)}>
                        {prefs.language === 'tr' ? 'Detay' : 'Details'}
                      </button>
                      <button type="button" onClick={() => activeMovie && handleToggleFavoriteAndHide(activeMovie, 'movie')}>
                        {isFavorite(getItemId(activeMovie)) ? t('inFavorites') : t('addFavorite')}
                      </button>
                      <button type="button" onClick={() => activeMovie && dismissMovie(activeMovie)}>
                        {prefs.language === 'tr' ? 'İzledim' : 'Watched'}
                      </button>
                    </div>
                  </div>

                  <div className="cinema-gallery-field">
                    <CircularGallery
                      items={movieGalleryItems}
                      bend={3.2}
                      textColor="#fff6e8"
                      borderRadius={0.045}
                      scrollSpeed={1.9}
                      scrollEase={0.035}
                      onActiveIndexChange={(index) => {
                        const movie = shownMovies.filter((item) => item.poster)[index];
                        if (movie) setActiveMovieId(getItemId(movie));
                      }}
                    />
                  </div>
                </div>
              </section>
            )}

            {recPrefs.showBooks && shownBooks.length > 0 && (
              <section className="zero-chapter zero-books" style={{ '--mood-accent-live': accent }}>
                <header className="zero-chapter-head">
                  <span>{t('read')}</span>
                  <h2>{t('readTitle')}</h2>
                  <p>{t('readCaption')}</p>
                </header>

                <div className="reading-runway">
                  <button
                    type="button"
                    onClick={() => activeBook && setBookDetail(activeBook)}
                    className="reading-cover-focus"
                  >
                    {activeBookCover && <img src={activeBookCover} alt={activeBook?.title || ''} />}
                  </button>

                  <div className="reading-copy">
                    <span>{prefs.language === 'tr' ? 'Kapak açılıyor' : 'Cover opens'}</span>
                    <h3>{activeBook?.title}</h3>
                    <p>{activeBook?.aiExplanation || activeBook?.overview || t('readCaption')}</p>
                    <div>
                      <button type="button" onClick={() => activeBook && setBookDetail(activeBook)}>
                        {prefs.language === 'tr' ? 'İnfo' : 'Info'}
                      </button>
                      <button type="button" onClick={() => activeBook && handleToggleFavoriteAndHide(activeBook, 'book')}>
                        {isFavorite(getItemId(activeBook)) ? t('inFavorites') : t('addFavorite')}
                      </button>
                      <button type="button" onClick={() => activeBook && dismissBook(activeBook)}>
                        {prefs.language === 'tr' ? 'Okudum' : 'Read'}
                      </button>
                    </div>
                  </div>

                  <div className="book-cover-stream">
                    {shownBooks.slice(0, 9).map((book, index) => {
                      const cover = book.poster ||
                        (book.title ? `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-L.jpg?default=false` : '');
                      const active = getItemId(book) === getItemId(activeBook);
                      return (
                        <button
                          key={book._id || book.title}
                          type="button"
                          onClick={() => setActiveBookId(getItemId(book))}
                          className={active ? 'is-active' : ''}
                          style={{ '--i': index }}
                        >
                          {cover && <img src={cover} alt={book.title} />}
                          <span>{book.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {movieDetail && (
        <FilmDetailModal
          item={movieDetail}
          onClose={() => setMovieDetail(null)}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
        />
      )}
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
