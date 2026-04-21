// MoodSummaryCard — high-level totals for the dashboard
import { MOOD_BY_VALUE } from '../utils/constants';

const Stat = ({ label, value, sublabel }) => (
  <div className="flex flex-col">
    <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
    <span className="mt-1 text-2xl font-bold text-white">{value}</span>
    {sublabel && <span className="text-xs text-slate-400">{sublabel}</span>}
  </div>
);

const MoodSummaryCard = ({ summary }) => {
  const mood = summary?.mostFrequentMood ? MOOD_BY_VALUE[summary.mostFrequentMood] : null;

  return (
    <div className="card">
      <h3 className="mb-4 text-base font-semibold text-white">Özet</h3>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Toplam Mood" value={summary?.totalMoods ?? 0} />
        <Stat
          label="En Sık"
          value={mood ? `${mood.emoji}` : '—'}
          sublabel={mood ? `${mood.label} (${summary.mostFrequentMoodCount})` : 'Veri yok'}
        />
        <Stat label="Ort. Yoğunluk" value={summary?.averageIntensity?.toFixed?.(1) ?? '0.0'} />
      </div>
    </div>
  );
};

export default MoodSummaryCard;
