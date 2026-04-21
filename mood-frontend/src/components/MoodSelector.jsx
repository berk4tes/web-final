// MoodSelector — 7 emoji mood buttons with active highlight
import { MOODS } from '../utils/constants';

const MoodSelector = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
      {MOODS.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            aria-pressed={active}
            className={`group flex flex-col items-center gap-1 rounded-2xl border bg-slate-900/60 p-3 transition ${
              active
                ? `scale-105 border-transparent ring-2 ${m.ring} shadow-lg`
                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-3xl transition group-hover:scale-110">{m.emoji}</span>
            <span className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MoodSelector;
