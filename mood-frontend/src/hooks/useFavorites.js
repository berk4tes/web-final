// useFavorites — add/remove/check helpers backed by the favorites API
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const useFavorites = () => {
  const [favoriteMap, setFavoriteMap] = useState({});

  const refreshAll = useCallback(async () => {
    try {
      const { data } = await api.get('/favorites', { params: { limit: 100 } });
      const map = {};
      for (const f of data.data.items) {
        map[f.externalId] = f._id;
      }
      setFavoriteMap(map);
    } catch (err) {
      // Silent — caller surface errors as needed
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const isFavorite = useCallback((externalId) => !!favoriteMap[externalId], [favoriteMap]);

  const add = useCallback(async ({ contentType, externalId, title, thumbnail }) => {
    try {
      const { data } = await api.post('/favorites', {
        contentType,
        externalId,
        title,
        thumbnail,
      });
      setFavoriteMap((prev) => ({ ...prev, [externalId]: data.data.favorite._id }));
      toast.success('Favorilere eklendi');
      return data.data.favorite;
    } catch (err) {
      const msg = err.response?.data?.message || 'Favoriye eklenemedi';
      toast.error(msg);
      throw err;
    }
  }, []);

  const remove = useCallback(
    async (externalId) => {
      const id = favoriteMap[externalId];
      if (!id) return;
      try {
        await api.delete(`/favorites/${id}`);
        setFavoriteMap((prev) => {
          const next = { ...prev };
          delete next[externalId];
          return next;
        });
        toast.success('Favorilerden kaldırıldı');
      } catch (err) {
        toast.error('Favori kaldırılamadı');
        throw err;
      }
    },
    [favoriteMap]
  );

  const toggle = useCallback(
    async (item) => {
      if (isFavorite(item.externalId)) {
        await remove(item.externalId);
      } else {
        await add(item);
      }
    },
    [isFavorite, add, remove]
  );

  return { favoriteMap, isFavorite, add, remove, toggle, refreshAll };
};

export default useFavorites;
