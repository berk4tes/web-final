// LoadingVibeState — soft pulsing orb shown while AI is interpreting the prompt
const LoadingVibeState = ({ message = 'Interpreting your vibe...' }) => (
  <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
    <div className="relative h-32 w-32">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-300 via-rose-200 to-amber-200 opacity-90 blur-2xl animate-pulse-soft" />
      <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-accent via-rose-300 to-amber-200 animate-orb-spin shadow-glow" />
      <div className="absolute inset-7 rounded-full bg-white/70 backdrop-blur" />
    </div>
    <p className="mt-8 font-display text-xl italic text-ink-600 animate-shimmer">{message}</p>
    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-ink-400">curating · listening · imagining</p>
  </div>
);

export default LoadingVibeState;
