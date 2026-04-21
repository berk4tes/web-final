// usePagination — local pagination state with bounds-aware navigation
import { useCallback, useState } from 'react';

export const usePagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const next = useCallback(() => {
    setPage((p) => Math.min(totalPages || 1, p + 1));
  }, [totalPages]);

  const prev = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const reset = useCallback(() => setPage(1), []);

  return { page, setPage, totalPages, setTotalPages, next, prev, reset };
};

export default usePagination;
