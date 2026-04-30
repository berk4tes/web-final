import { useUserPreferences } from '../context/UserPreferencesContext';

const MUSIC_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22><stop offset=%220%22 stop-color=%22%23e9e3ff%22/><stop offset=%221%22 stop-color=%22%23fad6c6%22/></linearGradient></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23g)%22/><circle cx=%2250%22 cy=%2250%22 r=%2218%22 fill=%22%23ffffff%22 fill-opacity=%220.5%22/><circle cx=%2250%22 cy=%2250%22 r=%226%22 fill=%22%231f1d18%22/></svg>';

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  </svg>
);

const SpotifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.69 14.42a.62.62 0 0 1-.85.21c-2.34-1.43-5.29-1.75-8.76-.96a.62.62 0 1 1-.27-1.21c3.79-.86 7.05-.49 9.66 1.11.3.18.4.59.22.85zm1.25-2.78a.78.78 0 0 1-1.06.26c-2.68-1.65-6.78-2.13-9.95-1.16a.78.78 0 0 1-.45-1.49c3.62-1.1 8.13-.57 11.21 1.33.36.22.47.7.25 1.06zm.11-2.9C14.83 8.85 9.4 8.65 6.32 9.59a.93.93 0 0 1-.55-1.78c3.54-1.08 9.51-.86 13.24 1.38a.93.93 0 1 1-.96 1.6z" />
  </svg>
);

const MusicCard = ({ item, index = 0, expanded = false, isFavorite, onToggleFavorite, onSelect }) => {
  const { t } = useUserPreferences();
  const favKey = item.externalId || item.title;
  const favored = isFavorite?.(favKey);
  const artist = item.artist || item.overview || '';

  const spotifyTrackQuery = encodeURIComponent(`${item.title} ${artist}`.trim());
  const spotifyTrackUrl = `https://open.spotify.com/search/${spotifyTrackQuery}`;
  const appleUrl = item.appleUrl || `https://music.apple.com/search?term=${spotifyTrackQuery}`;

  const spotifyArtistQuery = encodeURIComponent(artist.trim());
  const spotifyArtistUrl = artist
    ? `https://open.spotify.com/search/${spotifyArtistQuery}/artists`
    : spotifyTrackUrl;

  const handleFav = () =>
    onToggleFavorite?.({
      contentType: 'music',
      externalId: favKey,
      title: item.title,
      thumbnail: item.poster,
    });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(item);
    }
  };

  return (
    <article
      onClick={() => onSelect?.(item)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={expanded}
      className={`music-card group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-[1.35rem] border p-3 text-left outline-none transition-all duration-500 focus:ring-2 focus:ring-white/50 ${
        expanded
          ? 'min-h-[156px] border-[#f45f43]/70 bg-[#f45f43] text-ink-800 shadow-[0_20px_60px_rgba(244,95,67,0.28)]'
          : 'border-white/10 bg-white/8 text-white hover:border-white/22 hover:bg-white/12'
      }`}
      style={{ transitionDelay: `${Math.min(index, 8) * 26}ms` }}
    >
      <div
        className={`record-sleeve relative flex-shrink-0 overflow-visible rounded-[1rem] transition-all duration-500 ${
          expanded ? 'h-28 w-28' : 'h-14 w-14'
        }`}
      >
        <img
          src={item.poster || MUSIC_PLACEHOLDER}
          alt={item.title}
          className="relative z-10 h-full w-full rounded-[1rem] object-cover shadow-[0_12px_30px_rgba(0,0,0,0.24)] transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = MUSIC_PLACEHOLDER; }}
        />
        <span
          className={`record-disc pointer-events-none absolute top-1/2 aspect-square -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,#f8f7f4_0_9%,#15140f_10%_44%,#2c2922_45%_52%,#15140f_53%_100%)] shadow-[0_10px_34px_rgba(0,0,0,0.38)] transition-all duration-500 ${
            expanded ? '-right-10 w-24 rotate-45 opacity-100' : '-right-4 w-12 opacity-0 group-hover:opacity-70'
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold tabular-nums ${expanded ? 'text-ink-800/60' : 'text-white/30'}`}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={`truncate font-semibold ${expanded ? 'text-xl leading-tight text-ink-800' : 'text-sm text-white'}`}>
            {item.title}
          </h3>
        </div>
        {artist && (
          <a
            href={spotifyArtistUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`mt-1 block truncate text-xs transition hover:underline ${expanded ? 'text-ink-800/70 hover:text-ink-800' : 'text-white/55 hover:text-[#1DB954]'}`}
            title="Open artist on Spotify"
          >
            {artist}
          </a>
        )}
        {item.aiExplanation && (
          <p className={`mt-2 text-xs leading-relaxed ${expanded ? 'line-clamp-3 text-ink-800/78' : 'line-clamp-1 text-white/42'}`}>
            {item.aiExplanation}
          </p>
        )}
        {expanded && (
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={spotifyTrackUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black"
              title="Open on Spotify"
            >
              <SpotifyIcon />
              <span>{t('spotify')}</span>
            </a>
            <a
              href={appleUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-800/20 bg-white/35 px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-white/55"
              title="Open on Apple Music"
            >
              <span>{t('apple')}</span>
            </a>
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFav();
        }}
        aria-label={favored ? 'Remove from favorites' : 'Add to favorites'}
        className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full transition ${
          favored
            ? 'bg-rose-500 text-white'
            : expanded
              ? 'bg-ink-800/10 text-ink-800 hover:bg-rose-500 hover:text-white'
              : 'bg-white/10 text-white/60 hover:bg-rose-500 hover:text-white'
        }`}
      >
        <HeartIcon filled={favored} />
      </button>
    </article>
  );
};

export default MusicCard;
