import { useMoodTheme } from '../context/MoodThemeContext';
import { getVibeColor } from '../utils/constants';

const LoadingVibeState = ({ message = 'Interpreting your atmosphere...' }) => {
  const { colorKey } = useMoodTheme();
  const color = colorKey ? getVibeColor(colorKey) : null;

  const ringStyle = color
    ? { background: `conic-gradient(${color.accent} 0%, ${color.soft} 60%, ${color.accent} 100%)` }
    : { background: 'conic-gradient(#7c5cff 0%, #e9e3ff 60%, #7c5cff 100%)' };

  const glowStyle = color
    ? { background: `radial-gradient(ellipse at center, ${color.soft} 0%, transparent 70%)` }
    : { background: 'radial-gradient(ellipse at center, rgba(124,92,255,0.15) 0%, transparent 70%)' };

  const orbStyle = color
    ? { background: `linear-gradient(135deg, ${color.accent}, ${color.ink}55)` }
    : { background: 'linear-gradient(135deg, #7c5cff, #e87a4d)' };

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute h-96 w-96 rounded-full blur-3xl opacity-40 animate-pulse-soft"
        style={glowStyle}
      />

      {/* Spinner stack */}
      <div className="relative h-44 w-44">
        {/* Outer blurred halo */}
        <div
          className="absolute inset-0 rounded-full opacity-60 blur-2xl animate-pulse-soft"
          style={{ background: color ? color.soft : '#e9e3ff' }}
        />
        {/* Spinning ring */}
        <div
          className="absolute inset-0 rounded-full animate-orb-spin shadow-glow"
          style={{ ...ringStyle, padding: '5px' }}
        >
          <div className="h-full w-full rounded-full bg-[#f8f7f4]" />
        </div>
        {/* Inner orb */}
        <div className="absolute inset-5 rounded-full opacity-80 animate-pulse-soft" style={orbStyle} />
        {/* Core */}
        <div className="absolute inset-9 rounded-full bg-white/80 backdrop-blur" />
      </div>

      <p className="mt-10 font-display text-2xl font-semibold italic text-ink-600 animate-shimmer">
        {message}
      </p>
    </div>
  );
};

export default LoadingVibeState;
