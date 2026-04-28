import IntensityBar from './IntensityBar';
import SaveVibeButton from './SaveVibeButton';
import { getVibeColor } from '../utils/constants';

const MoodSummary = ({ prompt, mood, onSave, isSaved }) => {
  if (!mood) return null;
  const color = getVibeColor(mood.colorKey);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 shadow-soft animate-slide-up sm:p-10">
      <div
        className={`pointer-events-none absolute inset-0 opacity-60 bg-gradient-to-br ${color.gradient}`}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-white/40 blur-3xl" aria-hidden />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="section-eyebrow" style={{ color: color.ink }}>
              Your vibe
            </span>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-700 sm:text-5xl">
              {mood.title}
            </h1>
            {mood.summary && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-500 text-balance">
                {mood.summary}
              </p>
            )}
            {prompt && (
              <p className="mt-5 max-w-2xl text-sm italic text-ink-400">
                <span className="not-italic font-medium text-ink-500">Prompt: </span>"{prompt}"
              </p>
            )}
          </div>

          <SaveVibeButton onClick={onSave} isSaved={isSaved} colorKey={mood.colorKey} />
        </div>

        {mood.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {mood.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full px-3 py-1 text-xs font-medium tracking-wide"
                style={{ backgroundColor: color.soft, color: color.ink }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8">
          <IntensityBar intensity={mood.intensity} colorKey={mood.colorKey} />
        </div>
      </div>
    </section>
  );
};

export default MoodSummary;
