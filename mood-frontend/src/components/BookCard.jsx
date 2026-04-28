// BookCard — elegant book cover tile that opens an inline detail modal
const COVER_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 160 240%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%22 stop-color=%22%23faf0d4%22/><stop offset=%221%22 stop-color=%22%23e9e3ff%22/></linearGradient></defs><rect width=%22160%22 height=%22240%22 fill=%22url(%23g)%22/><text x=%2280%22 y=%22120%22 text-anchor=%22middle%22 fill=%22%237a7565%22 font-family=%22serif%22 font-size=%2218%22 font-style=%22italic%22>Book</text></svg>';

const HeartIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  </svg>
);

const BookCard = ({ item, onClick, isFavorite, onToggleFavorite }) => {
  const favKey = item.externalId || item.title;
  const favored = isFavorite?.(favKey);

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite?.({
      contentType: 'book',
      externalId: favKey,
      title: item.title,
      thumbnail: item.poster,
    });
  };

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="group relative flex w-full flex-col text-left transition focus:outline-none"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-ink-100 shadow-soft transition group-hover:-translate-y-1 group-hover:shadow-glow">
        <img
          src={item.poster || COVER_PLACEHOLDER}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = COVER_PLACEHOLDER;
          }}
        />
        <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/15 to-transparent" />

        <button
          onClick={handleFav}
          aria-label={favored ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full backdrop-blur transition ${
            favored
              ? 'bg-rose-500 text-white'
              : 'bg-white/85 text-ink-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white'
          }`}
        >
          <HeartIcon filled={favored} />
        </button>
      </div>

      <div className="mt-3 px-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-700 group-hover:text-accent-ink">{item.title}</h3>
        {item.overview && (
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">{item.overview}</p>
        )}
      </div>
    </button>
  );
};

export default BookCard;
