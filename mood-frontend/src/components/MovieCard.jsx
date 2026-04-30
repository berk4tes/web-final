import { useState } from 'react';
import { useUserPreferences } from '../context/UserPreferencesContext';

const POSTER_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%22 stop-color=%22%23efeee8%22/><stop offset=%221%22 stop-color=%22%23dcd9cf%22/></linearGradient></defs><rect width=%22200%22 height=%22300%22 fill=%22url(%23g)%22/></svg>';

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14L21 3" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MovieCard = ({
  item,
  index = 0,
  featured = false,
  onClick,
  onOpenDetail,
  isFavorite,
  onToggleFavorite,
  onWatched,
}) => {
  const { prefs } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const favKey = item.externalId || item.title;
  const favored = isFavorite?.(favKey);
  const [exiting, setExiting] = useState(false);
  const imdbUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(item.title)}`;
  const letterboxdUrl = `https://letterboxd.com/search/${encodeURIComponent(item.title)}/`;

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite?.({
      contentType: 'movie',
      externalId: favKey,
      title: item.title,
      thumbnail: item.poster,
    });
  };

  const handleWatched = (e) => {
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => onWatched?.(item), 280);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (featured) onOpenDetail?.(item);
      else onClick?.(item);
    }
  };

  const handleCardClick = () => {
    if (featured) {
      onOpenDetail?.(item);
      return;
    }
    onClick?.(item);
  };

  return (
    <div
      className={`movie-card-shell flex-shrink-0 transition-all duration-500 ${
        featured ? 'w-[18rem] sm:w-[21rem]' : 'w-40 sm:w-48'
      } ${exiting ? 'animate-slide-out-left pointer-events-none' : index === 4 ? 'animate-slide-in-right' : 'animate-scale-in'}`}
    >
      <article
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={featured}
        className={`group/movie relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[1.6rem] border text-left outline-none transition duration-500 focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
          featured
            ? 'border-white/35 bg-white/12 shadow-[0_24px_80px_rgba(0,0,0,0.34)] focus:ring-offset-ink-800'
            : 'border-white/10 bg-white/7 hover:-translate-y-1 hover:border-white/25 focus:ring-offset-ink-800'
        }`}
      >
        <div className={`relative w-full overflow-hidden ${featured ? 'aspect-[16/21]' : 'aspect-[2/3]'}`}>
          <img
            src={item.poster || POSTER_PLACEHOLDER}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover/movie:scale-110"
            onError={(e) => { e.currentTarget.src = POSTER_PLACEHOLDER; }}
          />
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/25 to-transparent transition duration-300 ${featured ? 'opacity-100' : 'opacity-0 group-hover/movie:opacity-100'}`} />
          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur">
            {String(index + 1).padStart(2, '0')}
          </div>

          <div className={`absolute inset-x-0 bottom-0 px-3 pb-3 transition duration-300 ${featured ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 group-hover/movie:translate-y-0 group-hover/movie:opacity-100'}`}>
            <h3 className={`font-semibold text-white ${featured ? 'line-clamp-2 text-xl leading-tight' : 'line-clamp-1 text-sm'}`}>{item.title}</h3>
            {item.aiExplanation && (
              <p className={`mt-1 text-xs leading-relaxed text-white/78 ${featured ? 'line-clamp-3' : 'line-clamp-2'}`}>{item.aiExplanation}</p>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail?.(item);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:bg-mood-happy"
              >
                <PlayIcon /> {tr ? 'Detay' : 'Info'}
              </button>
              {featured && (
                <>
                  <a
                    href={imdbUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-ink-800 transition hover:bg-yellow-300"
                  >
                    IMDb <ExternalLinkIcon />
                  </a>
                  <a
                    href={letterboxdUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-bold text-ink-800 transition hover:bg-emerald-300"
                  >
                    Letterboxd <ExternalLinkIcon />
                  </a>
                </>
              )}
              {item.genre && (
                <span className="rounded-full bg-white/20 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
                  {item.genre}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleFav}
            aria-label={favored ? 'Remove from favorites' : 'Add to favorites'}
            className={`absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition ${
              favored
                ? 'bg-rose-500 text-white'
                : 'bg-white/85 text-ink-500 opacity-0 group-hover/movie:opacity-100 hover:bg-rose-500 hover:text-white'
            }`}
          >
            <HeartIcon filled={favored} />
          </button>
        </div>

        <div className="px-3 py-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{item.title}</h3>
          {item.genre && <p className="mt-0.5 text-xs text-white/45">{item.genre}</p>}
        </div>
      </article>

      {onWatched && (
        <button
          onClick={handleWatched}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/14 bg-white/8 py-1.5 text-xs font-medium text-white/62 transition hover:border-emerald-300/60 hover:bg-emerald-300/12 hover:text-emerald-100"
        >
          <CheckIcon /> {tr ? 'İzledim' : 'Watched'}
        </button>
      )}
    </div>
  );
};

export default MovieCard;
