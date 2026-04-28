import { MOOD_BY_VALUE, MOOD_HEX } from '../utils/constants';
import { useUserPreferences } from '../context/UserPreferencesContext';

const Stat = ({ label, value, sublabel }) => (
  <div>
    <span className="text-xs uppercase tracking-wide text-ink-400">{label}</span>
    <div className="mt-1 font-display text-2xl font-semibold text-ink-700">{value}</div>
    {sublabel && <div className="text-xs text-ink-400">{sublabel}</div>}
  </div>
);

const MoodSummaryCard = ({ summary }) => {
  const { prefs } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const mood = summary?.mostFrequentMood ? MOOD_BY_VALUE[summary.mostFrequentMood] : null;
  const moodColor = mood ? MOOD_HEX[mood.value] : '#b9b4a4';

  return (
    <div className="card">
      <h3 className="font-display text-lg font-semibold text-ink-700">{tr ? 'Mood kayıtların' : 'Your moods'}</h3>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Stat label={tr ? 'Toplam' : 'Total'} value={summary?.totalMoods ?? 0} />
        <Stat
          label={tr ? 'En sık mood' : 'Top mood'}
          value={
            mood ? (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: moodColor }}
                />
                {mood.label}
              </span>
            ) : '-'
          }
          sublabel={mood ? `${summary.mostFrequentMoodCount}x ${tr ? 'kaydedildi' : 'logged'}` : (tr ? 'Henüz veri yok' : 'No data yet')}
        />
        <Stat label={tr ? 'Ortalama yoğunluk' : 'Avg intensity'} value={summary?.averageIntensity?.toFixed?.(1) ?? '0.0'} />
      </div>
    </div>
  );
};

export default MoodSummaryCard;
