const FlameIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.1 0 2-.7 2.4-1.7.4-.9.3-2-.3-2.8-.6-.8-1.2-1.5-1.2-2.5a3 3 0 0 1 3-3c.7 0 1.4.2 1.9.6" />
    <path d="M12 2c0 3.5-2.5 6-2.5 9 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5C14.5 8 12 5.5 12 2z" fill="white" opacity="0.7" />
  </svg>
);

const StreakCounter = ({ streak = 0 }) => (
  <div className="card flex items-center gap-4">
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-300 to-rose-300 shadow-soft">
      <FlameIcon />
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
