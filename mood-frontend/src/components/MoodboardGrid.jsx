// MoodboardGrid — Pinterest-style collage that mixes covers, posters, color swatches, gradient blocks
import { getVibeColor } from '../utils/constants';

const colorBlock = (key) => {
  const c = getVibeColor(key);
  return (
    <div
      className={`flex h-full w-full items-end bg-gradient-to-br ${c.gradient} p-3 text-xs font-semibold uppercase tracking-wider`}
      style={{ color: c.ink }}
    >
      {c.label}
    </div>
  );
};

const Tile = ({ children, height = 'h-44', className = '' }) => (
  <div className={`overflow-hidden rounded-2xl ${height} ${className}`}>{children}</div>
);

const ImageTile = ({ src, alt, height }) => (
  <Tile height={height}>
    <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
  </Tile>
);

const MoodboardGrid = ({ sections, mood }) => {
  if (!sections) return null;

  const posters = [...(sections.movies || []), ...(sections.books || []), ...(sections.music || [])]
    .filter((x) => x.poster)
    .slice(0, 6);

  if (posters.length === 0) return null;

  const fillers = [
    { type: 'color', key: mood?.colorKey || 'calm', height: 'h-44' },
    { type: 'quote', text: mood?.title, height: 'h-44' },
  ];

  const tiles = [];
  let f = 0;
  for (let i = 0; i < posters.length; i++) {
    tiles.push({ type: 'image', src: posters[i].poster, alt: posters[i].title });
    if (i === 1 || i === 3) {
      tiles.push(fillers[f % fillers.length]);
      f++;
    }
  }

  return (
    <section className="card animate-slide-up">
      <div className="mb-5">
        <span className="section-eyebrow">Moodboard</span>
        <h2 className="section-title mt-1">A visual snapshot</h2>
        <p className="mt-1 text-sm text-ink-400">
          Covers, colors and textures that capture the feel of your vibe.
        </p>
      </div>

      <div className="columns-2 gap-3 sm:columns-3 md:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {tiles.map((t, i) => {
          if (t.type === 'image') {
            return (
              <ImageTile
                key={i}
                src={t.src}
                alt={t.alt}
                height={i % 3 === 0 ? 'h-56' : 'h-44'}
              />
            );
          }
          if (t.type === 'color') {
            return (
              <Tile key={i} height="h-44">
                {colorBlock(t.key)}
              </Tile>
            );
          }
          if (t.type === 'quote') {
            const c = getVibeColor(mood?.colorKey || 'calm');
            return (
              <Tile key={i} height="h-44">
                <div
                  className="flex h-full w-full items-center justify-center p-4 text-center font-display text-2xl italic"
                  style={{ backgroundColor: c.soft, color: c.ink }}
                >
                  "{t.text || 'A quiet vibe'}"
                </div>
              </Tile>
            );
          }
          return null;
        })}
      </div>
    </section>
  );
};

export default MoodboardGrid;
