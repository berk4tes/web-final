// ProfilePage — profile editor + favorite list with debounced search
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import api from '../services/api';

const FavoriteCard = ({ fav, onRemove }) => (
  <div className="card flex flex-col">
    <div className="flex items-start gap-3">
      {fav.thumbnail ? (
        <img
          src={fav.thumbnail}
          alt={fav.title}
          className="h-20 w-14 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="grid h-20 w-14 flex-shrink-0 place-items-center rounded-lg bg-slate-800 text-2xl">
          🎬
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{fav.title}</h3>
        <span className="badge mt-2">{fav.contentType}</span>
      </div>
    </div>
    <button
      onClick={() => onRemove(fav._id)}
      className="mt-3 self-end rounded-lg border border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-900/30"
    >
      Kaldır
    </button>
  </div>
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
    if (user) {
      setForm({ username: user.username || '', avatar: user.avatar || '' });
    }
  }, [user]);

  const loadFavorites = async (q) => {
    setFavoritesLoading(true);
    try {
      if (q) {
        const { data } = await api.get('/favorites/search', { params: { q } });
        setFavorites(data.data.items);
      } else {
        const { data } = await api.get('/favorites', { params: { limit: 100 } });
        setFavorites(data.data.items);
      }
    } catch {
      toast.error('Favoriler yüklenemedi');
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites(debouncedSearch.trim());
  }, [debouncedSearch]);

  const handleProfileSave = async (ev) => {
    ev.preventDefault();
    if (!user) return;
    if (form.username.trim().length < 3) {
      toast.error('Kullanıcı adı en az 3 karakter olmalı');
      return;
    }
    setSavingProfile(true);
    try {
      const { data } = await api.patch(`/users/${user._id}`, {
        username: form.username.trim(),
        avatar: form.avatar.trim(),
      });
      updateUser(data.data.user);
      toast.success('Profil güncellendi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Güncellenemedi');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((f) => f._id !== id));
      toast.success('Favorilerden kaldırıldı');
    } catch {
      toast.error('Kaldırılamadı');
    }
  };

  const initials = useMemo(
    () => (user?.username?.[0] || 'U').toUpperCase(),
    [user]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Profil</h1>
        <p className="mt-1 text-sm text-slate-400">Hesap bilgilerini düzenle ve favorilerini yönet.</p>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="card">
          <div className="flex flex-col items-center text-center">
            {form.avatar ? (
              <img
                src={form.avatar}
                alt={user?.username}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-purple-500/40"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl font-bold text-white">
                {initials}
              </div>
            )}
            <h2 className="mt-4 text-lg font-semibold text-white">{user?.username}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="card space-y-4">
          <h3 className="text-base font-semibold text-white">Profili Düzenle</h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Kullanıcı Adı</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Avatar URL</label>
            <input
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="https://..."
              className="input"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-xl font-semibold text-white">Favorilerim</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başlığa göre ara..."
            className="input max-w-xs py-2 text-sm"
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
            icon="💔"
            title="Henüz favori eklemediniz"
            description="Önerilerden kalp ikonuna basarak favori ekleyebilirsin."
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
