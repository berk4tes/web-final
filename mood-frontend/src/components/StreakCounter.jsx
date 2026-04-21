// StreakCounter — consecutive-day streak display
const StreakCounter = ({ streak = 0 }) => (
  <div className="card flex items-center gap-4">
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-3xl shadow-lg shadow-orange-900/40">
      🔥
    </div>
    <div>
      <div className="text-3xl font-bold text-white">{streak}</div>
      <div className="text-sm text-slate-400">
        {streak > 0 ? `${streak} gün üst üste mood girdin!` : 'Bugün ilk mood\'unu gir'}
      </div>
    </div>
  </div>
);

export default StreakCounter;
