import { useState, useEffect } from 'react';

const PLACEHOLDER_POSTER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect width=%22200%22 height=%22300%22 fill=%22%231e293b%22/><text x=%22100%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%23475569%22 font-family=%22sans-serif%22 font-size=%2218%22>Görsel Yok</text></svg>';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const TYPE_LABEL = { movie: 'Film', series: 'Dizi', music: 'Müzik' };

const FilmDetailModal = ({ item, isFavorite, onToggleFavorite, onClose }) => {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const favKey = item.externalId || item.title;
  const favored = isFavorite(favKey);

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onToggleFavorite({
        contentType: item.contentType,
        externalId: item.externalId || item.title,
        title: item.title,
        thumbnail: item.poster,
      });
    } finally {
      setBusy(false);
    }
  };

  const encodedTitle = encodeURIComponent(item.title);
  const imdbUrl = `https://www.imdb.com/find/?q=${encodedTitle}`;
  const letterboxdUrl =
    item.contentType === 'movie'
      ? `https://letterboxd.com/search/${encodedTitle}/`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md animate-fade-in" />

      <div
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl shadow-slate-950 sm:flex-row animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        {/* Poster */}
        <div className="w-full flex-shrink-0 sm:w-48 lg:w-56">
          <img
            src={item.poster || PLACEHOLDER_POSTER}
            alt={item.title}
            className="h-52 w-full object-cover sm:h-full"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_POSTER; }}
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6 max-h-[70vh] sm:max-h-[520px]">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-purple-400">
                {TYPE_LABEL[item.contentType]}
              </span>
              <h2 className="mt-1 text-xl font-bold leading-snug text-white sm:text-2xl">
                {item.title}
              </h2>
              {item.genre && (
                <span className="mt-2 inline-block rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
                  {item.genre}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              aria-label="Kapat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* TMDB overview */}
          {item.overview && (
            <p className="text-sm leading-relaxed text-slate-400">{item.overview}</p>
          )}

          {/* AI explanation */}
          {item.aiExplanation && (
            <div className="border-l-2 border-purple-500/50 pl-3.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                Neden sana uygun?
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{item.aiExplanation}</p>
            </div>
          )}

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
            {(item.contentType === 'movie' || item.contentType === 'series') && (
              <a
                href={imdbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/20"
              >
                IMDb <ExternalLinkIcon />
              </a>
            )}
            {letterboxdUrl && (
              <a
                href={letterboxdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                Letterboxd <ExternalLinkIcon />
              </a>
            )}

            <div className="flex-1" />

            <button
              onClick={handleToggle}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                favored
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                  : 'border border-slate-700 text-slate-300 hover:border-pink-500/50 hover:text-pink-400'
              }`}
            >
              <HeartIcon filled={favored} />
              {favored ? 'Favorilerde' : 'Favoriye Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilmDetailModal;
