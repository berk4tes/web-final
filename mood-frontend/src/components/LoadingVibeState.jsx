import { useMoodTheme } from '../context/MoodThemeContext';
import { getVibeColor } from '../utils/constants';

const LoadingVibeState = ({ message = 'Warming up recommendations...' }) => {
  const { colorKey } = useMoodTheme();
  const color = colorKey ? getVibeColor(colorKey) : null;

  const style = {
    '--loading-accent': color?.accent || '#7c5cff',
    '--loading-soft': color?.soft || '#e9e3ff',
    '--loading-ink': color?.ink || '#1f1d18',
  };

  return (
    <div className="vibe-loading-state animate-fade-in" style={style}>
      <div className="vibe-loading-mark" aria-hidden>
        <div className="vibe-lab-capsule vibe-loading-capsule">
          <i />
          <i />
          <i />
        </div>
      </div>

      <p>{message}</p>
    </div>
  );
};

export default LoadingVibeState;
