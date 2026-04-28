import { useState } from 'react';
import toast from 'react-hot-toast';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getVibeColor } from '../utils/constants';

const moodQuotes = {
  calm: ['slow down, stay soft', 'quiet is a kind of power', 'small rituals, steady heart'],
  sad: ['let it be tender', 'some days arrive in blue', 'soft grief, open window'],
  nostalgic: ['somewhere, it is autumn again', 'old light, new ache', 'keep the memory warm'],
  angry: ['turn the heat into motion', 'sharp edges, clear eyes', 'let the storm speak'],
  dreamy: ['half here, half elsewhere', 'moonlight makes everything softer', 'stay in the beautiful blur'],
  happy: ['golden hour inside', 'choose the bright thing', 'sunlight has a sound'],
  excited: ['electric heart, open night', 'move like the city is yours', 'before the lights go up'],
};

const moodKeywords = {
  calm: ['linen', 'tea', 'fog', 'green', 'breath', 'morning'],
  sad: ['rain', 'blue', 'letters', 'windows', 'winter', 'silence'],
  nostalgic: ['autumn', 'film', 'wood', 'cafe', 'photos', 'memory'],
  angry: ['neon', 'storm', 'red', 'steel', 'motion', 'night'],
  dreamy: ['lavender', 'moon', 'mist', 'silk', 'clouds', 'blur'],
  happy: ['sun', 'flowers', 'fruit', 'laughter', 'yellow', 'picnic'],
  excited: ['lights', 'bass', 'city', 'spark', 'orange', 'rush'],
};

const boardLayouts = [
  'left-[6%] top-[6%] h-[29%] w-[31%] rotate-[-4deg]',
  'left-[39%] top-[5%] h-[19%] w-[24%] rotate-[3deg]',
  'right-[7%] top-[7%] h-[33%] w-[27%] rotate-[5deg]',
  'left-[11%] top-[39%] h-[20%] w-[25%] rotate-[4deg]',
  'left-[39%] top-[27%] h-[35%] w-[25%] rotate-[-2deg]',
  'right-[9%] top-[45%] h-[21%] w-[28%] rotate-[-5deg]',
  'left-[7%] bottom-[7%] h-[27%] w-[31%] rotate-[2deg]',
  'left-[42%] bottom-[9%] h-[22%] w-[22%] rotate-[5deg]',
  'right-[7%] bottom-[7%] h-[25%] w-[27%] rotate-[-2deg]',
];

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const createBoardSvg = ({ color, mood, quotes, keywords }) => {
  const title = escapeXml(mood?.title || color.label);
  const q0 = escapeXml(quotes[0]);
  const q1 = escapeXml(quotes[1]);
  const q2 = escapeXml(quotes[2]);
  const tags = keywords.slice(0, 5).map(escapeXml);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color.soft}"/>
      <stop offset="48%" stop-color="#fffaf0"/>
      <stop offset="100%" stop-color="${color.accent}"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="${color.soft}" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#1f1d18" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1080" height="1350" rx="64" fill="url(#bg)"/>
  <circle cx="190" cy="210" r="210" fill="${color.accent}" opacity="0.18"/>
  <circle cx="890" cy="1110" r="260" fill="${color.ink}" opacity="0.13"/>
  <g filter="url(#shadow)">
    <rect x="88" y="86" width="330" height="390" rx="42" fill="url(#card)" transform="rotate(-4 253 281)"/>
    <rect x="470" y="92" width="252" height="254" rx="38" fill="${color.ink}" opacity="0.88" transform="rotate(4 596 219)"/>
    <rect x="728" y="128" width="254" height="392" rx="42" fill="${color.soft}" transform="rotate(5 855 324)"/>
    <rect x="124" y="546" width="276" height="250" rx="38" fill="#fff" opacity="0.86" transform="rotate(4 262 671)"/>
    <rect x="438" y="388" width="278" height="434" rx="44" fill="${color.accent}" opacity="0.78" transform="rotate(-2 577 605)"/>
    <rect x="720" y="612" width="276" height="262" rx="38" fill="#fff" opacity="0.82" transform="rotate(-5 858 743)"/>
    <rect x="90" y="922" width="330" height="330" rx="42" fill="${color.ink}" opacity="0.84" transform="rotate(2 255 1087)"/>
    <rect x="468" y="980" width="240" height="250" rx="38" fill="${color.soft}" transform="rotate(5 588 1105)"/>
    <rect x="752" y="942" width="250" height="306" rx="42" fill="#fff" opacity="0.88" transform="rotate(-2 877 1095)"/>
  </g>
  <text x="128" y="160" font-family="Georgia, serif" font-size="44" font-weight="700" fill="${color.ink}">${title}</text>
  <text x="130" y="226" font-family="Inter, Arial" font-size="26" fill="${color.ink}" opacity="0.72">vision board</text>
  <text x="486" y="198" font-family="Georgia, serif" font-size="34" fill="#fff">"${q0}"</text>
  <text x="754" y="232" font-family="Inter, Arial" font-size="25" font-weight="700" fill="${color.ink}">${tags[0] || ''}</text>
  <text x="754" y="294" font-family="Inter, Arial" font-size="25" font-weight="700" fill="${color.ink}">${tags[1] || ''}</text>
  <text x="754" y="356" font-family="Inter, Arial" font-size="25" font-weight="700" fill="${color.ink}">${tags[2] || ''}</text>
  <text x="162" y="654" font-family="Georgia, serif" font-size="30" fill="${color.ink}">"${q1}"</text>
  <text x="480" y="520" font-family="Inter, Arial" font-size="24" font-weight="700" fill="#fff">${tags[3] || ''}</text>
  <text x="480" y="574" font-family="Inter, Arial" font-size="24" font-weight="700" fill="#fff">${tags[4] || ''}</text>
  <text x="140" y="1050" font-family="Georgia, serif" font-size="34" fill="#fff">"${q2}"</text>
  <text x="790" y="1086" font-family="Inter, Arial" font-size="28" font-weight="700" fill="${color.ink}">${escapeXml(color.label)}</text>
</svg>`;
};

const downloadSvg = (svg, filename) => {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const svgToDataUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const printBoardSvg = (svg, title) => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
  if (!printWindow) {
    toast.error('Popup blocked');
    return;
  }

  printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>${escapeXml(title)}</title>
  <style>
    @page { size: 1080px 1350px; margin: 0; }
    html, body {
      margin: 0;
      min-height: 100%;
      background: #f8f7f4;
      display: grid;
      place-items: center;
    }
    svg {
      width: 100vw;
      max-width: 1080px;
      height: auto;
      display: block;
    }
    @media print {
      html, body { background: white; }
      svg { width: 100%; height: 100%; }
    }
  </style>
</head>
<body>${svg}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
};

const VisualCard = ({ color, variant, children, className = '' }) => {
  const backgrounds = [
    `radial-gradient(circle at 28% 24%, ${color.accent}aa, transparent 34%), linear-gradient(145deg, ${color.soft}, #fff)`,
    `linear-gradient(135deg, ${color.ink}, ${color.accent})`,
    `repeating-linear-gradient(135deg, ${color.soft}, ${color.soft} 12px, color-mix(in srgb, ${color.accent} 24%, white) 12px, color-mix(in srgb, ${color.accent} 24%, white) 24px)`,
    `radial-gradient(circle at 70% 30%, #fff8, transparent 26%), radial-gradient(circle at 30% 76%, ${color.ink}66, transparent 32%), ${color.accent}`,
  ];

  return (
    <div
      className={`absolute overflow-hidden rounded-[28px] border border-white/45 bg-white/70 p-5 shadow-[0_22px_58px_rgba(31,29,24,0.16)] backdrop-blur transition duration-500 hover:z-20 hover:scale-[1.03] ${className}`}
      style={{ background: backgrounds[variant % backgrounds.length] }}
    >
      {children}
    </div>
  );
};

const MoodboardGrid = ({ sections, mood }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { prefs, t } = useUserPreferences();
  if (!mood) return null;

  const colorKey = mood?.colorKey || 'calm';
  const color = getVibeColor(colorKey);
  const quotes = moodQuotes[colorKey] || moodQuotes.calm;
  const keywords = moodKeywords[colorKey] || moodKeywords.calm;
  const titles = [...(sections?.movies || []), ...(sections?.books || []), ...(sections?.music || [])]
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 5);
  const tr = prefs.language === 'tr';
  const boardSvg = createBoardSvg({ color, mood, quotes, keywords });
  const boardFilename = `${(mood.title || 'moodboard').toLowerCase().replace(/\s+/g, '-')}-moodboard.svg`;

  const handleDownload = () => {
    downloadSvg(boardSvg, boardFilename);
  };

  const handleShare = async () => {
    const text = `${mood.title}: ${quotes[0]}`;
    const file = new File([boardSvg], boardFilename, { type: 'image/svg+xml' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: mood.title || 'Moodboard', text, files: [file] });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: mood.title || 'Moodboard', text, url: window.location.href });
      return;
    }
    await navigator.clipboard?.writeText(text);
    toast.success(tr ? 'Paylaşım metni kopyalandı' : 'Share text copied');
  };

  const handlePdf = () => printBoardSvg(boardSvg, mood.title || 'Moodboard');

  return (
    <section className="animate-slide-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="section-eyebrow">{t('moodboardEyebrow')}</span>
          <h2 className="section-title mt-1">{t('moodboardTitle')}</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-400">{t('moodboardCaption')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPreviewOpen(true)} className="btn-secondary text-sm">
            {tr ? 'Tam gör' : 'Full view'}
          </button>
          <button type="button" onClick={handleShare} className="btn-secondary text-sm">
            {tr ? 'Paylaş' : 'Share'}
          </button>
          <button type="button" onClick={handleDownload} className="btn-secondary text-sm">
            {tr ? 'Story indir' : 'Story download'}
          </button>
          <button type="button" onClick={handlePdf} className="btn-secondary text-sm">
            PDF
          </button>
        </div>
      </div>

      <div
        className="relative mx-auto aspect-[4/5] w-full max-w-5xl overflow-hidden rounded-[42px] border border-white/45 p-4 shadow-[0_28px_90px_rgba(31,29,24,0.18)]"
        style={{
          background:
            `linear-gradient(135deg, ${color.soft} 0%, color-mix(in srgb, ${color.accent} 22%, white) 42%, color-mix(in srgb, ${color.ink} 18%, white) 100%)`,
        }}
      >
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${color.accent}55` }} />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: `${color.ink}2f` }} />

        <VisualCard color={color} variant={0} className={boardLayouts[0]}>
          <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: color.ink }}>
            {color.label}
          </span>
          <h3 className="mt-3 font-display text-4xl font-semibold leading-none" style={{ color: color.ink }}>
            {mood.title}
          </h3>
        </VisualCard>

        <VisualCard color={color} variant={1} className={boardLayouts[1]}>
          <p className="font-display text-2xl font-semibold italic leading-tight text-white">"{quotes[0]}"</p>
        </VisualCard>

        <VisualCard color={color} variant={2} className={boardLayouts[2]}>
          <div className="flex h-full flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: color.ink }}>
              mood notes
            </span>
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 6).map((word) => (
                <span key={word} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold" style={{ color: color.ink }}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        </VisualCard>

        <VisualCard color={color} variant={3} className={boardLayouts[3]}>
          <p className="font-display text-2xl font-semibold italic leading-tight text-white">"{quotes[1]}"</p>
        </VisualCard>

        <VisualCard color={color} variant={0} className={boardLayouts[4]}>
          <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 35% 30%, #fff9, transparent 26%), radial-gradient(circle at 68% 72%, ${color.accent}, transparent 34%)` }} />
          <div className="relative flex h-full flex-col justify-end">
            <div className="flex gap-2">
              {[color.accent, color.soft, color.ink].map((swatch) => (
                <span key={swatch} className="h-10 w-10 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: swatch }} />
              ))}
            </div>
          </div>
        </VisualCard>

        <VisualCard color={color} variant={2} className={boardLayouts[5]}>
          <div className="grid h-full place-items-center">
            <div className="h-28 w-28 rounded-full border-[18px] border-white/70" style={{ boxShadow: `0 0 0 18px ${color.accent}66` }} />
          </div>
        </VisualCard>

        <VisualCard color={color} variant={1} className={boardLayouts[6]}>
          <p className="font-display text-3xl font-semibold italic leading-tight text-white">"{quotes[2]}"</p>
        </VisualCard>

        <VisualCard color={color} variant={0} className={boardLayouts[7]}>
          <div className="space-y-2">
            {(titles.length ? titles : keywords.slice(0, 4)).slice(0, 4).map((title) => (
              <div key={title} className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold shadow-sm" style={{ color: color.ink }}>
                {title}
              </div>
            ))}
          </div>
        </VisualCard>

        <VisualCard color={color} variant={3} className={boardLayouts[8]}>
          <div className="h-full w-full rounded-[22px] border border-white/40" style={{ background: `linear-gradient(160deg, #fff8, transparent), radial-gradient(circle at 50% 50%, ${color.soft}, ${color.accent})` }} />
        </VisualCard>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-800/70 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[92vh] w-full max-w-[760px]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink-700 shadow-soft"
            >
              {tr ? 'Kapat' : 'Close'}
            </button>
            <img
              src={svgToDataUrl(boardSvg)}
              alt={mood.title || 'Moodboard'}
              className="max-h-[92vh] w-full rounded-[32px] object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default MoodboardGrid;
