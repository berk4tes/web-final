import SaveVibeButton from './SaveVibeButton';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getVibeColor } from '../utils/constants';

const MoodSummary = ({ mood, onSave, isSaved }) => {
  const { t } = useUserPreferences();
  if (!mood) return null;
  const color = getVibeColor(mood.colorKey);

  return (
    <section className="relative animate-slide-up py-4 sm:py-6">
      <div className="mood-summary-stage relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
        <div
          className={`pointer-events-none absolute inset-0 opacity-75 bg-gradient-to-br ${color.gradient}`}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-white/50 blur-3xl animate-pulse-soft" aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-6 h-28 w-28 rounded-full border border-white/40 bg-white/15 backdrop-blur-sm animate-float-swirl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: color.accent }} />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: color.ink }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color.accent }} />
              {t('activeMood')}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink-700 text-balance sm:text-5xl">
              {mood.title}
            </h1>
            {mood.summary && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-500 text-balance">
                {mood.summary}
              </p>
            )}
            {mood.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {mood.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold tracking-wide"
                    style={{ color: color.ink }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <SaveVibeButton onClick={onSave} isSaved={isSaved} colorKey={mood.colorKey} />
        </div>
      </div>
    </section>
  );
};

export default MoodSummary;
