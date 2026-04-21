// ResultCard — single recommendation tile with poster, AI explanation, favorite toggle
import { useState } from 'react';

const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLACEHOLDER_POSTER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect width=%22200%22 height=%22300%22 fill=%22%231e293b%22/><text x=%22100%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%23475569%22 font-family=%22sans-serif%22 font-size=%2218%22>Görsel Yok</text></svg>';

const ResultCard = ({ item, isFavorite, onToggleFavorite }) => {
  const [busy, setBusy] = useState(false);

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

  const favKey = item.externalId || item.title;
  const favored = isFavorite(favKey);

  return (
    <article className="card group relative flex flex-col transition hover:-translate-y-1 hover:border-purple-700/60 hover:shadow-purple-900/30">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={item.poster || PLACEHOLDER_POSTER}
          alt={item.title}
          className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_POSTER;
          }}
        />
        <button
          onClick={handleToggle}
          disabled={busy}
          aria-label={favored ? 'Favoriden çıkar' : 'Favoriye ekle'}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${
            favored
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40'
              : 'bg-slate-900/70 text-slate-200 hover:bg-pink-500 hover:text-white'
          } disabled:opacity-50`}
        >
          <HeartIcon filled={favored} />
        </button>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-base font-semibold text-white">{item.title}</h3>
        {item.genre && <span className="badge mt-2 self-start">{item.genre}</span>}
        {item.aiExplanation && (
          <p className="mt-3 line-clamp-4 text-sm text-slate-400">{item.aiExplanation}</p>
        )}
      </div>
    </article>
  );
};

export default ResultCard;
