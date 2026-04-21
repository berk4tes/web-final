// MoodInputPage — main feature: pick mood, intensity, content type → AI recommendations
import { useState } from 'react';
import toast from 'react-hot-toast';
import IntensitySlider from '../components/IntensitySlider';
import MoodSelector from '../components/MoodSelector';
import ResultsGrid from '../components/ResultsGrid';
import { CONTENT_TYPES } from '../utils/constants';
import useFavorites from '../hooks/useFavorites';
import api from '../services/api';

const MoodInputPage = () => {
  const [mood, setMood] = useState('');
  const [moodText, setMoodText] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [contentType, setContentType] = useState('movie');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isFavorite, toggle } = useFavorites();

  const canSubmit = !!mood && !loading;

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!mood) {
      toast.error('Lütfen önce bir mood seç');
      return;
    }
    setLoading(true);
    setItems([]);
    try {
      const { data } = await api.post('/recommendations/mood', {
        moodLabel: mood,
        moodText,
        intensity,
        contentType,
      });
      setItems(data.data.recommendations || []);
      toast.success(`${data.data.recommendations.length} öneri hazır!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Öneriler alınamadı';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="card animate-slide-up">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Bugün nasıl hissediyorsun?</h1>
        <p className="mt-1 text-sm text-slate-400">
          Mood'unu seç, AI senin için kişiselleştirilmiş öneriler hazırlasın.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">Mood</label>
            <MoodSelector value={mood} onChange={setMood} />
          </div>

          <div>
            <label htmlFor="moodText" className="mb-1 block text-sm font-medium text-slate-300">
              Detay (opsiyonel)
            </label>
            <textarea
              id="moodText"
              rows={3}
              maxLength={500}
              value={moodText}
              onChange={(e) => setMoodText(e.target.value)}
              placeholder="Bugün nasıl hissediyorsun? Birkaç cümle yazabilirsin..."
              className="input resize-none"
            />
            <div className="mt-1 text-right text-xs text-slate-500">{moodText.length}/500</div>
          </div>

          <IntensitySlider value={intensity} onChange={setIntensity} />

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">İçerik Tipi</label>
            <div className="grid grid-cols-3 gap-3">
              {CONTENT_TYPES.map((t) => {
                const active = contentType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setContentType(t.value)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition ${
                      active
                        ? 'border-purple-500 bg-purple-600/20 text-white shadow-lg shadow-purple-900/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={!canSubmit} className="btn-primary w-full text-base">
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Claude düşünüyor...
              </>
            ) : (
              'Önerileri Al ✨'
            )}
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-white">Öneriler</h2>
        <ResultsGrid
          items={items}
          loading={loading}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
          emptyTitle="Henüz öneri yok"
          emptyDescription="Bir mood seçip 'Önerileri Al' butonuna basarak AI önerilerini gör."
        />
      </section>
    </div>
  );
};

export default MoodInputPage;
