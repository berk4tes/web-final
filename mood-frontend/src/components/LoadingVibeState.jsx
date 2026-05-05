import { useEffect, useState } from 'react';
import { useMoodTheme } from '../context/MoodThemeContext';
import { getVibeColor } from '../utils/constants';

const LoadingVibeState = ({ message = 'Warming up recommendations...' }) => {
  const { colorKey } = useMoodTheme();
  const [progress, setProgress] = useState(1);
  const color = colorKey ? getVibeColor(colorKey) : null;

  useEffect(() => {
    let frame = null;
    const startedAt = performance.now();
    const tick = (now) => {
      const elapsed = now - startedAt;
      const next = Math.min(100, Math.max(1, Math.round((elapsed / 2200) * 100)));
      setProgress(next);
      if (next < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const style = {
    '--loading-accent': color?.accent || '#7c5cff',
    '--loading-soft': color?.soft || '#e9e3ff',
    '--loading-ink': color?.ink || '#1f1d18',
  };

  return (
    <div className="vibe-loading-state animate-fade-in" style={style}>
      <div className="vibe-loading-mark" aria-hidden>
        <div className="vibe-loading-orbit">
          <span className="vibe-loading-orbit-ring vibe-loading-orbit-ring-a" />
          <span className="vibe-loading-orbit-ring vibe-loading-orbit-ring-b" />
          <span className="vibe-loading-orbit-glow" />
        </div>
        <strong className="vibe-loading-percent">{progress}%</strong>
        <div className="vibe-loading-sphere">
          <span className="vibe-loading-sphere-layer vibe-loading-sphere-layer-a" />
          <span className="vibe-loading-sphere-layer vibe-loading-sphere-layer-b" />
          <span className="vibe-loading-sphere-layer vibe-loading-sphere-layer-c" />
          <span className="vibe-loading-sphere-highlight" />
          <span className="vibe-loading-sphere-core" />
        </div>
      </div>

      <p>{message}</p>
    </div>
  );
};

export default LoadingVibeState;
