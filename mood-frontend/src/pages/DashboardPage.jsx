import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';
import { useUserPreferences } from '../context/UserPreferencesContext';
import api from '../services/api';
import { getVibeColor } from '../utils/constants';
import { readUserScopedJson, writeUserScopedJson } from '../utils/userStorage';

const SAVED_VIBES_KEY = 'luma.savedVibes';
const RECENT_MOODS_KEY = 'luma.recentMoods';
const WATCHED_KEY = 'luma.watched';
const READ_KEY = 'luma.readBooks';

const AnimatedNumber = ({ value, duration = 900 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplay(0);
      return undefined;
    }
    let frame = null;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.max(1, Math.round(target * eased)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return display;
};

const moodLabel = (mood, language = 'en') => {
  const labels = {
    happy: { en: 'Sunlit', tr: 'Güneşli' },
    sad: { en: 'Melancholic', tr: 'Melankolik' },
    excited: { en: 'Electric', tr: 'Elektrik' },
    calm: { en: 'Calm', tr: 'Sakin' },
    angry: { en: 'Intense', tr: 'Yoğun' },
    nostalgic: { en: 'Nostalgic', tr: 'Nostaljik' },
    tired: { en: 'Tired', tr: 'Yorgun' },
    dreamy: { en: 'Dreamy', tr: 'Dalgın' },
  };
  return labels[mood]?.[language] || mood || (language === 'tr' ? 'Sakin' : 'Calm');
};

const moodFromColorKey = (colorKey) => ({
  dreamy: 'dreamy',
  happy: 'happy',
  sad: 'sad',
  excited: 'excited',
  angry: 'angry',
  nostalgic: 'nostalgic',
  calm: 'calm',
}[colorKey] || 'calm');

const localDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const parseMoodHistory = (items = []) =>
  items.map((item) => ({
    id: item._id || `${item.moodLabel}-${item.loggedAt}`,
    moodLabel: item.moodLabel || 'calm',
    moodText: item.moodText || '',
    intensity: item.intensity || 5,
    loggedAt: item.loggedAt || item.createdAt || new Date().toISOString(),
  }));

const getItemKey = (item) => item?._id || item?.externalId || item?.title;

const getCollectionThumbnail = async (item, type) => {
  if (item?.thumbnail) return item.thumbnail;
  if (!item?.title) return '';
  if (type === 'watched') {
    const { data } = await api.get('/recommendations/tmdb/details', {
      params: {
        title: item.title,
        contentType: item.contentType === 'series' ? 'series' : 'movie',
      },
    });
    return data?.data?.details?.poster || '';
  }
  if (type === 'read') {
    const query = encodeURIComponent(item.title);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&printType=books`);
    const data = await res.json();
    const imageLinks = data?.items?.[0]?.volumeInfo?.imageLinks || {};
    return (imageLinks.thumbnail || imageLinks.smallThumbnail || '').replace(/^http:/, 'https:');
  }
  if (type === 'music') {
    const query = encodeURIComponent(item.title);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`);
    const data = await res.json();
    return (data?.results?.[0]?.artworkUrl100 || '').replace('100x100bb', '600x600bb');
  }
  return '';
};

const formatDate = (value, language) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getMoodCounts = (savedVibes, history) => {
  const counts = new Map();
  savedVibes.forEach((vibe) => {
    const key = moodFromColorKey(vibe.mood?.colorKey);
    counts.set(key, (counts.get(key) || 0) + 2);
  });
  history.forEach((entry) => {
    const key = moodFromColorKey(entry.moodLabel);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const getStreak = (savedVibes, history) => {
  const days = new Set([
    ...savedVibes.map((vibe) => localDateKey(vibe.savedAt)),
    ...history.map((entry) => localDateKey(entry.loggedAt)),
  ].filter(Boolean));
  let streak = 0;
  const cursor = new Date();
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const DashboardCalendar = ({ history, savedVibes, language }) => {
  const days = useMemo(() => {
    const today = new Date();
    const byDay = new Map();

    history.forEach((entry) => {
      const key = localDateKey(entry.loggedAt);
      if (!key) return;
      const current = byDay.get(key);
      if (!current || entry.intensity >= current.intensity) byDay.set(key, entry);
    });

    savedVibes.forEach((vibe) => {
      const key = localDateKey(vibe.savedAt);
      if (!key || byDay.has(key)) return;
      byDay.set(key, {
        id: vibe.id,
        moodLabel: moodFromColorKey(vibe.mood?.colorKey),
        moodText: vibe.prompt,
        intensity: Math.round((vibe.mood?.intensity || 0.5) * 10),
        loggedAt: vibe.savedAt,
      });
    });

    return Array.from({ length: 30 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      const key = localDateKey(date);
      return { key, date, entry: byDay.get(key) };
    });
  }, [history, savedVibes]);

  return (
    <section className="dash-panel dash-calendar">
      <div className="dash-section-head">
        <span>{language === 'tr' ? 'Mood takvimi' : 'Mood calendar'}</span>
        <strong>{language === 'tr' ? '30 gün' : '30 days'}</strong>
      </div>
      <div className="dash-calendar-grid">
        {days.map(({ key, date, entry }) => {
          const color = entry ? getVibeColor(entry.moodLabel) : null;
          return (
            <div
              key={key}
              className={`dash-calendar-day ${entry ? 'is-filled' : ''}`}
              title={entry ? `${moodLabel(entry.moodLabel, language)} - ${entry.moodText}` : key}
              style={entry ? {
                '--day-accent': color.accent,
                '--day-soft': color.soft,
                '--day-ink': color.ink,
              } : undefined}
            >
              <span>{date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric' })}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const YourMoods = ({ moodCounts, language }) => {
  const tr = language === 'tr';
  const visible = moodCounts.length ? moodCounts.slice(0, 5) : [['calm', 1], ['dreamy', 1], ['nostalgic', 1]];
  const max = Math.max(...visible.map(([, count]) => count), 1);
  const [dominantKey, dominantCount] = visible[0];
  const dominantColor = getVibeColor(dominantKey);
  const secondary = visible.slice(1, 5);

  return (
    <section className="dash-panel dash-moods">
      <div className="dash-section-head">
        <span>{tr ? 'Mood haritan' : 'Your moods'}</span>
      </div>
      <div
        className="dash-mood-composition"
        style={{
          '--dominant-accent': dominantColor.accent,
          '--dominant-soft': dominantColor.soft,
          '--dominant-ink': dominantColor.ink,
        }}
      >
        <div className="dash-dominant-mood">
          <span>{tr ? 'baskın mood' : 'dominant mood'}</span>
          <strong>{moodLabel(dominantKey, language)}</strong>
        </div>

        <div className="dash-mood-constellation" aria-hidden>
          {secondary.map(([key, count], index) => {
            const color = getVibeColor(key);
            const size = 44 + (count / max) * 48;
            return (
              <span
                key={key}
                className="dash-mood-satellite"
                style={{
                  '--satellite-accent': color.accent,
                  '--satellite-soft': color.soft,
                  '--satellite-size': `${size}px`,
                  '--satellite-index': index,
                }}
              />
            );
          })}
        </div>

        <div className="dash-mood-spectrum">
          {visible.map(([key, count]) => {
            const color = getVibeColor(key);
            return (
              <div key={key} className="dash-mood-spectrum-row">
                <span>{moodLabel(key, language)}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.max(8, (count / max) * 100)}%`,
                      background: `linear-gradient(90deg, ${color.accent}, color-mix(in srgb, ${color.accent} 36%, #fff7ea))`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const RecentMoods = ({ savedVibes, recentMoods, history, onReplay, language }) => {
  const tr = language === 'tr';
  const timeline = [
    ...recentMoods.slice(0, 5).map((entry) => ({
      id: `recent-${entry.id}`,
      title: entry.mood?.title || moodLabel(entry.mood?.colorKey, language),
      prompt: entry.prompt,
      moodKey: moodFromColorKey(entry.mood?.colorKey),
      date: entry.savedAt,
    })),
    ...history.slice(0, 5).map((entry) => ({
      id: entry.id,
      title: moodLabel(entry.moodLabel, language),
      prompt: entry.moodText,
      moodKey: moodFromColorKey(entry.moodLabel),
      date: entry.loggedAt,
    })),
    ...savedVibes.slice(0, 5).map((vibe) => ({
      id: `saved-${vibe.id}`,
      title: vibe.mood?.title || moodLabel(vibe.mood?.colorKey, language),
      prompt: vibe.prompt,
      moodKey: moodFromColorKey(vibe.mood?.colorKey),
      date: vibe.savedAt,
    })),
  ].filter((item, index, arr) => item.prompt && arr.findIndex((x) => x.prompt === item.prompt) === index).slice(0, 5);

  return (
    <section className="dash-recent">
      <div className="dash-section-head">
        <span>{tr ? 'Son moodlar' : 'Recent moods'}</span>
        <strong>{timeline.length}</strong>
      </div>
      {timeline.length === 0 ? (
        <div className="dash-empty-line">
          {tr ? 'İlk mood araman burada görünecek.' : 'Your first mood search will appear here.'}
        </div>
      ) : (
        <div className="dash-recent-rail">
          {timeline.map((entry, index) => {
            const color = getVibeColor(entry.moodKey);
            return (
              <button
                key={entry.id || index}
                type="button"
                onClick={() => onReplay({ prompt: entry.prompt })}
                className="dash-recent-item"
                style={{ '--recent-accent': color.accent, '--recent-soft': color.soft }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{entry.title}</strong>
                <em>{entry.prompt}</em>
                <small>{formatDate(entry.date, language)}</small>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

const SavedVibesPanel = ({ savedVibes, onReplay, language }) => {
  const tr = language === 'tr';
  const items = savedVibes.slice(0, 8);

  return (
    <section className="dash-saved-vibes">
      <div className="dash-collections-head">
        <div>
          <span>{tr ? 'Saved vibes' : 'Saved vibes'}</span>
          <h2>{tr ? 'Kaydettiğin atmosferler.' : 'Atmospheres you kept.'}</h2>
        </div>
        <Link to="/vibe">{tr ? 'Yeni vibe' : 'New vibe'}</Link>
      </div>
      {items.length === 0 ? (
        <div className="dash-empty-line">{tr ? 'Henüz saved vibe yok.' : 'No saved vibes yet.'}</div>
      ) : (
        <div className="dash-saved-vibe-grid">
          {items.map((vibe, index) => {
            const key = moodFromColorKey(vibe.mood?.colorKey);
            const color = getVibeColor(key);
            return (
              <button
                key={vibe.id || `${vibe.prompt}-${index}`}
                type="button"
                onClick={() => onReplay(vibe)}
                style={{ '--saved-accent': color.accent, '--saved-soft': color.soft, '--saved-ink': color.ink }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{vibe.mood?.title || moodLabel(key, language)}</strong>
                <em>{vibe.prompt}</em>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

const CollectionTile = ({ item, type, onRemove, language }) => {
  const tr = language === 'tr';
  const date = item.savedAt || item.watchedAt || item.readAt || item.createdAt;
  const [thumbnail, setThumbnail] = useState(item.thumbnail || '');

  useEffect(() => {
    let active = true;
    setThumbnail(item.thumbnail || '');
    if (item.thumbnail || !item.title) return () => { active = false; };
    getCollectionThumbnail(item, type)
      .then((url) => {
        if (active) setThumbnail(url || '');
      })
      .catch(() => {
        if (active) setThumbnail('');
      });
    return () => { active = false; };
  }, [item, type]);

  return (
    <article className={`dash-collection-tile dash-collection-${type}`}>
      <div className="dash-collection-art">
        {thumbnail ? (
          <img src={thumbnail} alt={item.title} loading="lazy" />
        ) : (
          <span>{item.title}</span>
        )}
      </div>
      <div className="dash-collection-copy">
        <span>{type === 'music' ? (tr ? 'favori müzik' : 'favorite music') : type === 'read' ? (tr ? 'okunan kitap' : 'read book') : (tr ? 'izlenen' : 'watched')}</span>
        <h3>{item.title}</h3>
        <p>{formatDate(date, language) || (tr ? 'koleksiyonda' : 'in collection')}</p>
      </div>
      {onRemove && (
        <button type="button" onClick={() => onRemove(getItemKey(item))}>
          {tr ? 'Sil' : 'Remove'}
        </button>
      )}
    </article>
  );
};

const Collections = ({ favoriteMusic, watchedMedia, readBooks, onRemoveFavorite, onRemoveWatched, onRemoveRead, language }) => {
  const tr = language === 'tr';
  const [active, setActive] = useState('music');
  const groups = {
    music: {
      label: tr ? 'Fav müzikler' : 'Fav music',
      count: favoriteMusic.length,
      items: favoriteMusic,
      empty: tr ? 'Favori müziklerin burada toplanacak.' : 'Favorite music will gather here.',
      remove: onRemoveFavorite,
    },
    watched: {
      label: tr ? 'İzlenenler' : 'Watched',
      count: watchedMedia.length,
      items: watchedMedia,
      empty: tr ? 'Film ve diziler burada olacak.' : 'Movies and series you watched live here.',
      remove: onRemoveWatched,
    },
    read: {
      label: tr ? 'Okunanlar' : 'Read books',
      count: readBooks.length,
      items: readBooks,
      empty: tr ? 'Okuduğun kitaplar ayrı tutulacak.' : 'Books you read are kept separate.',
      remove: onRemoveRead,
    },
  };
  const current = groups[active];

  return (
    <section className="dash-collections">
      <div className="dash-collections-head">
        <div>
          <span>{tr ? 'Koleksiyon' : 'Collections'}</span>
          <h2>{tr ? 'Arşivin, doğru raflarda.' : 'Your archive, sorted by intent.'}</h2>
        </div>
        <Link to="/vibe">{tr ? 'Yeni keşif' : 'New discovery'}</Link>
      </div>
      <div className="dash-collection-tabs">
        {Object.entries(groups).map(([id, group]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={active === id ? 'is-active' : ''}
          >
            <span>{group.label}</span>
            <strong>{group.count}</strong>
          </button>
        ))}
      </div>
      {current.items.length === 0 ? (
        <div className="dash-empty-line">{current.empty}</div>
      ) : (
        <div className="dash-collection-grid">
          {current.items.map((item, index) => (
            <CollectionTile
              key={getItemKey(item) || index}
              item={item}
              type={active === 'watched' ? 'watched' : active}
              onRemove={current.remove}
              language={language}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id;
  const { theme } = useMoodTheme();
  const { prefs, t } = useUserPreferences();
  const language = prefs.language || 'en';
  const tr = language === 'tr';

  const [savedVibes, setSavedVibes] = useState([]);
  const [recentMoods, setRecentMoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watched, setWatched] = useState([]);
  const [readBooks, setReadBooks] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);

  useEffect(() => {
    const vibes = readUserScopedJson(SAVED_VIBES_KEY, userId, []);
    const recent = readUserScopedJson(RECENT_MOODS_KEY, userId, []);
    const watchedItems = readUserScopedJson(WATCHED_KEY, userId, []);
    const readItems = readUserScopedJson(READ_KEY, userId, []);
    setSavedVibes(Array.isArray(vibes) ? vibes : []);
    setRecentMoods(Array.isArray(recent) ? recent : []);
    setWatched(Array.isArray(watchedItems) ? watchedItems : []);
    setReadBooks(Array.isArray(readItems) ? readItems : []);
  }, [userId]);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/moods/history', { params: { limit: 80 } });
        if (active) setMoodHistory(parseMoodHistory(data.data.items));
      } catch {
        if (active) setMoodHistory([]);
      }
    };
    loadHistory();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      try {
        const { data } = await api.get('/favorites', { params: { limit: 100 } });
        if (active) setFavorites(Array.isArray(data.data.items) ? data.data.items : []);
      } catch {
        if (active) setFavorites([]);
      }
    };
    loadFavorites();
    return () => { active = false; };
  }, []);

  const favoriteMusic = useMemo(
    () => favorites.filter((item) => item.contentType === 'music'),
    [favorites]
  );
  const watchedMedia = useMemo(
    () => watched.filter((item) => item.contentType === 'movie' || item.contentType === 'series' || !item.contentType),
    [watched]
  );
  const moodCounts = useMemo(() => getMoodCounts(savedVibes, moodHistory), [savedVibes, moodHistory]);
  const streak = useMemo(() => getStreak(savedVibes, moodHistory), [savedVibes, moodHistory]);
  const topMood = moodCounts[0]?.[0] || savedVibes[0]?.mood?.colorKey || 'dreamy';
  const topColor = getVibeColor(topMood);
  const totalSignals = savedVibes.length + moodHistory.length + favoriteMusic.length + watchedMedia.length + readBooks.length;

  const handleReplay = (vibe) => {
    navigate('/vibe', vibe?.prompt ? { state: { replayPrompt: vibe.prompt } } : undefined);
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((item) => item._id !== id));
      toast.success(tr ? 'Favoriden kaldırıldı' : 'Removed from favorites');
    } catch {
      toast.error(tr ? 'Kaldırılamadı' : 'Could not remove');
    }
  };

  const handleRemoveWatched = (key) => {
    const next = watched.filter((item) => getItemKey(item) !== key);
    setWatched(next);
    writeUserScopedJson(WATCHED_KEY, userId, next);
  };

  const handleRemoveRead = (key) => {
    const next = readBooks.filter((item) => getItemKey(item) !== key);
    setReadBooks(next);
    writeUserScopedJson(READ_KEY, userId, next);
  };

  return (
    <div className="dash-page" style={{ '--dash-accent': theme?.accent || topColor.accent, '--dash-soft': theme?.soft || topColor.soft, '--dash-ink': theme?.ink || topColor.ink }}>
      <section className="dash-hero">
        <div className="dash-hero-copy">
          <span>{t('navDashboard')}</span>
          <h1 className="text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.9]">{tr ? 'Mood arşivin, daha keskin bir sinyal gibi.' : 'Your mood archive, tuned like a signal.'}</h1>
        </div>
        <div className="dash-hero-metrics">
          <div>
            <span>{tr ? 'Seri' : 'Streak'}</span>
            <strong><AnimatedNumber value={streak} /></strong>
            <em>{tr ? 'gün' : 'days'}</em>
          </div>
          <div>
            <span>{tr ? 'Sinyal' : 'Signals'}</span>
            <strong><AnimatedNumber value={totalSignals} /></strong>
            <em>{tr ? 'canlı sayaç' : 'live count'}</em>
          </div>
          <div>
            <span>{tr ? 'Vibe' : 'Vibes'}</span>
            <strong><AnimatedNumber value={savedVibes.length} /></strong>
            <em>{tr ? 'kayıtlı' : 'saved'}</em>
          </div>
        </div>
      </section>

      <section className="dash-topology">
        <YourMoods moodCounts={moodCounts} language={language} />
        <DashboardCalendar history={moodHistory} savedVibes={savedVibes} language={language} />
      </section>

      <RecentMoods savedVibes={savedVibes} recentMoods={recentMoods} history={moodHistory} onReplay={handleReplay} language={language} />

      <SavedVibesPanel savedVibes={savedVibes} onReplay={handleReplay} language={language} />

      <Collections
        favoriteMusic={favoriteMusic}
        watchedMedia={watchedMedia}
        readBooks={readBooks}
        onRemoveFavorite={handleRemoveFavorite}
        onRemoveWatched={handleRemoveWatched}
        onRemoveRead={handleRemoveRead}
        language={language}
      />

    </div>
  );
};

export default DashboardPage;
