const MUSIC_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%22 stop-color=%22%23e9e3ff%22/><stop offset=%221%22 stop-color=%22%23fad6c6%22/></linearGradient></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23g)%22/><circle cx=%2250%22 cy=%2250%22 r=%2218%22 fill=%22%23ffffff%22 fill-opacity=%220.5%22/><circle cx=%2250%22 cy=%2250%22 r=%226%22 fill=%22%231f1d18%22/></svg>';

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

const MusicCard = ({ item, isFavorite, onToggleFavorite }) => {
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

  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-3 transition hover:border-accent/30 hover:bg-ink-50/40 hover:shadow-soft">
      <a
        href={spotifyTrackUrl}
        target="_blank"
        rel="noreferrer"
        className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl"
        title="Open track on Spotify"
      >
        <img
          src={item.poster || MUSIC_PLACEHOLDER}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = MUSIC_PLACEHOLDER; }}
        />
        <span className="absolute inset-0 grid place-items-center bg-ink-800/50 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
          Play
        </span>
      </a>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-ink-700">{item.title}</h3>
        {artist && (
          <a
            href={spotifyArtistUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 block truncate text-xs text-ink-400 transition hover:text-[#1DB954] hover:underline"
            title="Open artist on Spotify"
          >
            {artist}
          </a>
        )}
        {item.aiExplanation && (
          <p className="mt-1 line-clamp-1 text-xs italic text-ink-400">{item.aiExplanation}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleFav}
          aria-label={favored ? 'Remove from favorites' : 'Add to favorites'}
          className={`grid h-9 w-9 place-items-center rounded-full transition ${
            favored ? 'bg-rose-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-rose-100 hover:text-rose-500'
          }`}
        >
          <HeartIcon filled={favored} />
        </button>
        <a
          href={spotifyTrackUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-full bg-[#1DB954] px-3 py-2 text-xs font-medium text-white transition hover:brightness-110 sm:inline-flex"
          title="Open on Spotify"
        >
          <SpotifyIcon />
          <span>{t('spotify')}</span>
        </a>
        <a
          href={appleUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-full bg-ink-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-ink-600 sm:inline-flex"
          title="Open on Apple Music"
        >
          <span>{t('apple')}</span>
        </a>
      </div>
    </article>
  );
};

export default MusicCard;
import { useUserPreferences } from '../context/UserPreferencesContext';
