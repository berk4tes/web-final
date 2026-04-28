// MovieCard — Netflix-inspired tile with hover overlay revealing synopsis + tags
const POSTER_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%22 stop-color=%22%23efeee8%22/><stop offset=%221%22 stop-color=%22%23dcd9cf%22/></linearGradient></defs><rect width=%22200%22 height=%22300%22 fill=%22url(%23g)%22/><text x=%22100%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%237a7565%22 font-family=%22sans-serif%22 font-size=%2216%22>Poster</text></svg>';

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  </svg>
);

const MovieCard = ({ item, onClick, isFavorite, onToggleFavorite }) => {
  const favKey = item.externalId || item.title;
  const favored = isFavorite?.(favKey);

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite?.({
      contentType: 'movie',
      externalId: favKey,
      title: item.title,
      thumbnail: item.poster,
    });
  };

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-ink-100 text-left transition duration-300 hover:-translate-y-1 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img
          src={item.poster || POSTER_PLACEHOLDER}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = POSTER_PLACEHOLDER;
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-800/85 via-ink-800/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 translate-y-3 px-4 pb-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{item.title}</h3>
          {item.aiExplanation && (
            <p className="mt-1 line-clamp-2 text-xs text-white/80">{item.aiExplanation}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700">
              <PlayIcon /> Trailer
            </span>
            {item.genre && (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
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
              : 'bg-white/85 text-ink-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white'
          }`}
        >
          <HeartIcon filled={favored} />
        </button>
      </div>

      <div className="px-3 py-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink-700 group-hover:text-accent-ink">{item.title}</h3>
        {item.genre && <p className="mt-0.5 text-xs text-ink-400">{item.genre}</p>}
      </div>
    </button>
  );
};

export default MovieCard;
