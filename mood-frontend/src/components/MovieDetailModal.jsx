import { useEffect } from 'react';

const POSTER_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect width=%22200%22 height=%22300%22 fill=%22%23efeee8%22/></svg>';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const MovieDetailModal = ({ item, onClose }) => {
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  const trailerQuery = encodeURIComponent(`${item.title} trailer`);
  const trailerUrl = `https://www.youtube.com/results?search_query=${trailerQuery}`;
  const imdbUrl = `https://www.imdb.com/find?q=${encodeURIComponent(item.title)}`;
  const letterboxdUrl = `https://letterboxd.com/search/${encodeURIComponent(item.title)}/`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-800/40 px-4 py-8 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-slide-up"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink-600 shadow-soft transition hover:bg-white"
        >
          <CloseIcon />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          <div className="relative h-72 md:h-auto">
            <img
              src={item.poster || POSTER_PLACEHOLDER}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = POSTER_PLACEHOLDER; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-800/40 to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/0" />
          </div>

          <div className="p-6 sm:p-8">
            <span className="section-eyebrow">Film / Series</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700 sm:text-4xl">
              {item.title}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.genre && <span className="chip">{item.genre}</span>}
            </div>

            {item.aiExplanation && (
              <p className="mt-5 text-sm italic leading-relaxed text-ink-500">
                "{item.aiExplanation}"
              </p>
            )}

            {item.overview && (
              <div className="mt-5">
                <span className="section-eyebrow">Overview</span>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.overview}</p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-2.5">
              <a href={trailerUrl} target="_blank" rel="noreferrer" className="btn-primary">
                <PlayIcon /> Watch trailer
              </a>
              <a href={imdbUrl} target="_blank" rel="noreferrer" className="btn-secondary">IMDb</a>
              <a href={letterboxdUrl} target="_blank" rel="noreferrer" className="btn-secondary">Letterboxd</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;
