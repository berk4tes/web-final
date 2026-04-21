// DashboardPage — analytics, streak, summary, and filterable recommendation history
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import MoodSummaryCard from '../components/MoodSummaryCard';
import ResultsGrid from '../components/ResultsGrid';
import StreakCounter from '../components/StreakCounter';
import WeeklyMoodChart from '../components/WeeklyMoodChart';
import useFavorites from '../hooks/useFavorites';
import usePagination from '../hooks/usePagination';
import { CONTENT_TYPES } from '../utils/constants';
import api from '../services/api';

const DashboardPage = () => {
  const [weekly, setWeekly] = useState({ days: [] });
  const [streak, setStreak] = useState(0);
  const [summary, setSummary] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { page, setPage, totalPages, setTotalPages, next, prev } = usePagination(1);

  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatsLoading(true);
      try {
        const [w, s, sum] = await Promise.all([
          api.get('/stats/weekly'),
          api.get('/stats/streak'),
          api.get('/stats/summary'),
        ]);
        if (!active) return;
        setWeekly(w.data.data);
        setStreak(s.data.data.streak);
        setSummary(sum.data.data);
      } catch {
        toast.error('İstatistikler yüklenemedi');
      } finally {
        if (active) setStatsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const params = { page, limit: 9 };
        if (filterType) params.contentType = filterType;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const { data } = await api.get('/recommendations/history', { params });
        if (!active) return;
        setHistory(data.data.items);
        setTotalPages(data.data.pagination.totalPages || 1);
      } catch {
        toast.error('Geçmiş yüklenemedi');
      } finally {
        if (active) setHistoryLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [page, filterType, startDate, endDate, setTotalPages]);

  const resetFilters = () => {
    setFilterType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Mood geçmişin ve öneri istatistiklerin.</p>
      </div>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StreakCounter streak={streak} />
        </div>
        <div className="lg:col-span-2">
          <MoodSummaryCard summary={summary} />
        </div>
      </section>

      <section>
        {statsLoading ? (
          <div className="card h-72 animate-pulse" />
        ) : (
          <WeeklyMoodChart days={weekly.days} />
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-xl font-semibold text-white">Geçmiş Öneriler</h2>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Tür</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="input py-2 text-sm"
            >
              <option value="">Hepsi</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Başlangıç</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="input py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Bitiş</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="input py-2 text-sm"
            />
          </div>
          {(filterType || startDate || endDate) && (
            <button onClick={resetFilters} className="btn-ghost text-sm">
              Filtreleri Temizle
            </button>
          )}
        </div>

        <ResultsGrid
          items={history}
          loading={historyLoading}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
          emptyTitle="Henüz geçmiş öneri yok"
          emptyDescription="Mood gir ve öneri al — geçmişin burada listelenecek."
        />

        {!historyLoading && history.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <button onClick={prev} disabled={page <= 1} className="btn-secondary text-sm">
              ← Önceki
            </button>
            <span className="text-sm text-slate-400">
              Sayfa {page} / {totalPages}
            </span>
            <button onClick={next} disabled={page >= totalPages} className="btn-secondary text-sm">
              Sonraki →
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
