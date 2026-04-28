// VibePage — main feature: prompt input → AI mood interpretation → music + movies + books + moodboard
import { useEffect, useMemo, useState } from 'react';
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
import useFavorites from '../hooks/useFavorites';
import api from '../services/api';
import { VIBE_PROMPT_EXAMPLES, getVibeColor } from '../utils/constants';

const SAVED_VIBES_KEY = 'moodflix.savedVibes';

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6L12 2zm7 10l.9 2.4L22 15.5l-2.1.9L19 19l-.9-2.6L16 15.5l2.1-1.1L19 12zM5 13l.7 1.9L7.5 16 5.6 17 5 19l-.6-2L2.5 16l1.9-1.1L5 13z" />
  </svg>
);

const VibePage = () => {
  const [prompt, setPrompt] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [movieDetail, setMovieDetail] = useState(null);
  const [bookDetail, setBookDetail] = useState(null);
  const [savedVibes, setSavedVibes] = useState([]);

  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_VIBES_KEY) || '[]');
      if (Array.isArray(stored)) setSavedVibes(stored);
    } catch {
      // ignore
    }
  }, []);

  const isSaved = useMemo(() => {
    if (!data) return false;
    return savedVibes.some((v) => v.prompt === data.prompt && v.mood?.title === data.mood?.title);
  }, [data, savedVibes]);

  const handleGenerate = async (overridePrompt) => {
    const value = (overridePrompt ?? prompt).trim();
    if (value.length < 3) {
      toast.error('Write a few more words about your vibe');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const { data: res } = await api.post('/recommendations/vibe', { prompt: value });
      setData(res.data);
      if (overridePrompt) setPrompt(overridePrompt);
      setTimeout(() => {
        document
          .getElementById('vibe-results')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not interpret your vibe');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVibe = () => {
    if (!data) return;
    if (isSaved) {
      const next = savedVibes.filter(
        (v) => !(v.prompt === data.prompt && v.mood?.title === data.mood?.title)
      );
      setSavedVibes(next);
      localStorage.setItem(SAVED_VIBES_KEY, JSON.stringify(next));
      toast.success('Vibe removed from saved');
      return;
    }
    const entry = {
      id: Date.now(),
      prompt: data.prompt,
      mood: data.mood,
      sections: data.sections,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...savedVibes].slice(0, 30);
    setSavedVibes(next);
    localStorage.setItem(SAVED_VIBES_KEY, JSON.stringify(next));
    toast.success('Vibe saved ✨');
  };

  const heroColor = data ? getVibeColor(data.mood?.colorKey) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 sm:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative max-w-3xl">
          <span className="section-eyebrow">
            <SparkleIcon /> AI vibe interpreter
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-700 text-balance sm:text-6xl">
            Describe a feeling.<br />
            Get a playlist, films, and books.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500 text-balance sm:text-lg">
            Type a mood, atmosphere, or a media reference. We'll interpret the vibe and craft a
            full discovery moment for you.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
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
              {loading ? 'Interpreting...' : 'Generate ✨'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Try:</span>
            {VIBE_PROMPT_EXAMPLES.slice(0, 4).map((ex) => (
              <button
                key={ex}
                onClick={() => handleGenerate(ex)}
                disabled={loading}
                className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 transition hover:border-accent hover:text-accent-ink disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div id="vibe-results" className="mt-12 space-y-12">
        {loading && <LoadingVibeState />}

        {!loading && !data && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl">🌿</span>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink-700">
              Your discovery moment will appear here
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-400">
              The more evocative the prompt, the richer the vibe. Try citing a feeling, a place, a
              piece of media, or even a weather.
            </p>
          </div>
        )}

        {data && !loading && (
          <>
            <MoodSummary
              prompt={data.prompt}
              mood={data.mood}
              onSave={handleSaveVibe}
              isSaved={isSaved}
            />

            {data.sections.music?.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow="🎧 Soundtrack"
                  title="A playlist for the moment"
                  caption="Curated to match the rhythm of your vibe."
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {data.sections.music.map((m) => (
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

            {data.sections.movies?.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow="🎬 Watch"
                  title="Films & series to escape into"
                  caption="Hover for a peek, click to dive deeper — never leaves the page."
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {data.sections.movies.map((m) => (
                    <MovieCard
                      key={m._id || m.title}
                      item={m}
                      onClick={setMovieDetail}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggle}
                    />
                  ))}
                </div>
              </section>
            )}

            {data.sections.books?.length > 0 && (
              <section className="animate-slide-up">
                <SectionHeader
                  eyebrow="📖 Read"
                  title="Books that breathe the same air"
                  caption="Hand-picked for the texture of this mood."
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {data.sections.books.map((b) => (
                    <BookCard
                      key={b._id || b.title}
                      item={b}
                      onClick={setBookDetail}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggle}
                    />
                  ))}
                </div>
              </section>
            )}

            <MoodboardGrid sections={data.sections} mood={data.mood} />
          </>
        )}
      </div>

      {data && !loading && (
        <button
          onClick={handleSaveVibe}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-glow backdrop-blur transition hover:scale-105 active:scale-95"
          style={{
            backgroundColor: isSaved ? heroColor.accent : 'white',
            color: isSaved ? 'white' : heroColor.ink,
            border: `1px solid ${heroColor.accent}`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {isSaved ? 'Vibe saved' : 'Save this vibe'}
        </button>
      )}

      <MovieDetailModal item={movieDetail} onClose={() => setMovieDetail(null)} />
      <BookDetailModal item={bookDetail} onClose={() => setBookDetail(null)} />
    </div>
  );
};

export default VibePage;
