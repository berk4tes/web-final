// SaveVibeButton — pill-shaped CTA that saves the current vibe (prompt + mood + recs)
import { getVibeColor } from '../utils/constants';

const BookmarkIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const SaveVibeButton = ({ onClick, isSaved, colorKey = 'calm' }) => {
  const color = getVibeColor(colorKey);
  return (
    <button
      onClick={onClick}
      type="button"
      className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
      style={{
        backgroundColor: isSaved ? color.accent : 'white',
        borderColor: color.accent,
        color: isSaved ? 'white' : color.ink,
      }}
    >
      <BookmarkIcon filled={isSaved} />
      <span>{isSaved ? 'Vibe saved' : 'Save this vibe'}</span>
    </button>
  );
};

export default SaveVibeButton;
