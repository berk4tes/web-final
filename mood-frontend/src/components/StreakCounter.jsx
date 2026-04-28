// StreakCounter — streak display in light theme
const StreakCounter = ({ streak = 0 }) => (
  <div className="card flex items-center gap-4">
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-300 to-rose-300 text-2xl shadow-soft">
      🔥
    </div>
    <div>
      <div className="font-display text-3xl font-bold text-ink-700">{streak}</div>
      <div className="text-sm text-ink-400">
        {streak > 0 ? `${streak} day streak` : 'Log your first mood today'}
      </div>
    </div>
  </div>
);

export default StreakCounter;
