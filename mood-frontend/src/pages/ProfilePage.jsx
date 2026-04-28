// ProfilePage — profile editor + favorites list with debounced search (light theme)
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import api from '../services/api';

const FavoriteCard = ({ fav, onRemove }) => (
  <article className="card flex flex-col">
    <div className="flex items-start gap-3">
      {fav.thumbnail ? (
        <img
          src={fav.thumbnail}
          alt={fav.title}
          className="h-20 w-14 flex-shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="grid h-20 w-14 flex-shrink-0 place-items-center rounded-xl bg-ink-100 text-2xl">
          {fav.contentType === 'book' ? '📘' : fav.contentType === 'music' ? '🎵' : '🎬'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-700">{fav.title}</h3>
        <span className="chip mt-2">{fav.contentType}</span>
      </div>
    </div>
    <button
      onClick={() => onRemove(fav._id)}
      className="mt-3 self-end rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50"
    >
      Remove
    </button>
  </article>
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ username: '', avatar: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (user) setForm({ username: user.username || '', avatar: user.avatar || '' });
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setFavoritesLoading(true);
      try {
        if (debouncedSearch.trim()) {
          const { data } = await api.get('/favorites/search', { params: { q: debouncedSearch.trim() } });
          setFavorites(data.data.items);
        } else {
          const { data } = await api.get('/favorites', { params: { limit: 100 } });
          setFavorites(data.data.items);
        }
      } catch {
        toast.error('Could not load favorites');
      } finally {
        setFavoritesLoading(false);
      }
    };
    load();
  }, [debouncedSearch]);

  const handleProfileSave = async (ev) => {
    ev.preventDefault();
    if (!user) return;
    if (form.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    setSavingProfile(true);
    try {
      const { data } = await api.patch(`/users/${user._id}`, {
        username: form.username.trim(),
        avatar: form.avatar.trim(),
      });
      updateUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((f) => f._id !== id));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Could not remove');
    }
  };

  const initials = useMemo(() => (user?.username?.[0] || 'U').toUpperCase(), [user]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <span className="section-eyebrow">Account</span>
        <h1 className="section-title mt-2">Profile</h1>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="card text-center">
          {form.avatar ? (
            <img
              src={form.avatar}
              alt={user?.username}
              className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-accent/30"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-accent via-rose-300 to-amber-200 text-3xl font-bold text-white">
              {initials}
            </div>
          )}
          <h2 className="mt-4 font-display text-xl font-semibold text-ink-700">{user?.username}</h2>
          <p className="text-sm text-ink-400">{user?.email}</p>
        </div>

        <form onSubmit={handleProfileSave} className="card space-y-4">
          <h3 className="font-display text-lg font-semibold text-ink-700">Edit profile</h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">Avatar URL</label>
            <input
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="https://..."
              className="input"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <span className="section-eyebrow">Library</span>
            <h2 className="font-display text-2xl font-semibold text-ink-700 mt-1">Favorites</h2>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="input max-w-xs"
          />
        </div>

        {favoritesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-36 animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon="💌"
            title="No favorites yet"
            description="Tap the heart on any recommendation to save it here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <FavoriteCard key={fav._id} fav={fav} onRemove={handleRemoveFavorite} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
