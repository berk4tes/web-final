// IntensityBar — animated horizontal bar tinted to mood color, fills to intensity %
import { useEffect, useState } from 'react';
import { getVibeColor } from '../utils/constants';

const IntensityBar = ({ intensity = 0.5, colorKey = 'calm', label = 'Emotional intensity' }) => {
  const color = getVibeColor(colorKey);
  const pct = Math.round(Math.max(0, Math.min(1, intensity)) * 100);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="section-eyebrow">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-ink-500">{pct}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color.gradient} transition-[width] duration-1000 ease-out`}
          style={{ width: `${animated}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md transition-[left] duration-1000 ease-out"
          style={{
            left: `calc(${animated}% - 7px)`,
            background: color.accent,
            boxShadow: `0 0 0 4px ${color.soft}`,
          }}
        />
      </div>
    </div>
  );
};

export default IntensityBar;
