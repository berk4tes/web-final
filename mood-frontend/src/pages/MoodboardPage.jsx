import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMoodTheme } from '../context/MoodThemeContext';
import api from '../services/api';

/* ─── Canvas dimensions (poster format) ─────────────── */
const CW = 600;
const CH = 840;

/* ─── Per-layout image slot positions ───────────────── */
const LAYOUT_SLOTS = {
  editorial: [
    { xp: 0.05, yp: 0.13, wp: 0.42, hp: 0.23, r: -2.8 },
    { xp: 0.53, yp: 0.06, wp: 0.44, hp: 0.20, r:  2.2 },
    { xp: 0.03, yp: 0.37, wp: 0.40, hp: 0.22, r: -1.6 },
    { xp: 0.47, yp: 0.31, wp: 0.50, hp: 0.24, r:  3.1 },
    { xp: 0.05, yp: 0.58, wp: 0.44, hp: 0.22, r:  1.9 },
    { xp: 0.49, yp: 0.56, wp: 0.47, hp: 0.21, r: -2.4 },
    { xp: 0.21, yp: 0.79, wp: 0.57, hp: 0.18, r:  1.1 },
    { xp: 0.04, yp: 0.81, wp: 0.17, hp: 0.13, r: -3.6 },
  ],
  pinterest: [
    { xp: 0.03, yp: 0.12, wp: 0.45, hp: 0.26, r: 0 },
    { xp: 0.51, yp: 0.12, wp: 0.45, hp: 0.26, r: 0 },
    { xp: 0.03, yp: 0.40, wp: 0.45, hp: 0.26, r: 0 },
    { xp: 0.51, yp: 0.40, wp: 0.45, hp: 0.26, r: 0 },
    { xp: 0.03, yp: 0.68, wp: 0.45, hp: 0.26, r: 0 },
    { xp: 0.51, yp: 0.68, wp: 0.45, hp: 0.26, r: 0 },
    { xp: 0.15, yp: 0.94, wp: 0.68, hp: 0.05, r: 0 },
    { xp: 0.03, yp: 0.92, wp: 0.10, hp: 0.07, r: 0 },
  ],
  cutout: [
    { xp: 0.05, yp: 0.08, wp: 0.62, hp: 0.36, r: -3.5 },
    { xp: 0.52, yp: 0.18, wp: 0.44, hp: 0.24, r:  4.2 },
    { xp: 0.02, yp: 0.44, wp: 0.36, hp: 0.32, r: -2.1 },
    { xp: 0.32, yp: 0.46, wp: 0.54, hp: 0.28, r:  3.8 },
    { xp: 0.62, yp: 0.56, wp: 0.34, hp: 0.26, r: -4.8 },
    { xp: 0.04, yp: 0.74, wp: 0.50, hp: 0.22, r:  2.2 },
    { xp: 0.50, yp: 0.78, wp: 0.46, hp: 0.19, r: -1.8 },
    { xp: 0.18, yp: 0.88, wp: 0.28, hp: 0.10, r:  5.5 },
  ],
  diary: [
    { xp: 0.08, yp: 0.10, wp: 0.38, hp: 0.20, r: -6.5 },
    { xp: 0.50, yp: 0.07, wp: 0.42, hp: 0.22, r:  5.2 },
    { xp: 0.06, yp: 0.33, wp: 0.44, hp: 0.22, r:  4.4 },
    { xp: 0.44, yp: 0.30, wp: 0.48, hp: 0.20, r: -3.2 },
    { xp: 0.04, yp: 0.55, wp: 0.40, hp: 0.22, r:  7.1 },
    { xp: 0.46, yp: 0.52, wp: 0.46, hp: 0.23, r: -5.4 },
    { xp: 0.14, yp: 0.77, wp: 0.62, hp: 0.18, r:  3.3 },
    { xp: 0.02, yp: 0.80, wp: 0.14, hp: 0.14, r: -8.2 },
  ],
};

const BACKGROUNDS = {
  paper:  { bg: '#f5f0e8', fg: '#1a1614', label: 'Paper' },
  cream:  { bg: '#faf6f0', fg: '#1a1614', label: 'Warm Cream' },
  pastel: { bg: '#edf0f7', fg: '#1a1614', label: 'Pastel Blue' },
  blush:  { bg: '#f7eded', fg: '#1a1614', label: 'Blush' },
  sage:   { bg: '#edf2ed', fg: '#1a1614', label: 'Sage' },
  dark:   { bg: '#1a1714', fg: '#f5f0e8', label: 'Dark Editorial' },
};

const LAYOUTS = [
  { id: 'editorial', label: 'Editorial' },
  { id: 'pinterest', label: 'Soft Pinterest' },
  { id: 'cutout',    label: 'Magazine Cutout' },
  { id: 'diary',     label: 'Travel Diary' },
];

const STICKER_GROUPS = [
  {
    label: 'Icons',
    items: [
      { name: 'bow',      ch: '🎀' },
      { name: 'star',     ch: '⭐' },
      { name: 'heart',    ch: '🤍' },
      { name: 'sparkle',  ch: '✦' },
      { name: 'flower',   ch: '🌸' },
      { name: 'moon',     ch: '🌙' },
      { name: 'ribbon',   ch: '🎗' },
      { name: 'diamond',  ch: '💎' },
      { name: 'star2',    ch: '★' },
      { name: 'arrow',    ch: '↗' },
      { name: 'cross',    ch: '✚' },
      { name: 'leaf',     ch: '✾' },
    ],
  },
  {
    label: 'Vintage',
    items: [
      { name: 'camera',      ch: '📷' },
      { name: 'film',        ch: '🎞' },
      { name: 'vinyl',       ch: '💿' },
      { name: 'cassette',    ch: '📼' },
      { name: 'ticket',      ch: '🎟' },
      { name: 'headphones',  ch: '🎧' },
      { name: 'guitar',      ch: '🎸' },
      { name: 'music',       ch: '♫' },
      { name: 'disco',       ch: '🪩' },
      { name: 'coffee',      ch: '☕' },
      { name: 'book',        ch: '📖' },
      { name: 'telephone',   ch: '☎' },
    ],
  },
  {
    label: 'Nature',
    items: [
      { name: 'rose',        ch: '🌹' },
      { name: 'daisy',       ch: '🌼' },
      { name: 'sun',         ch: '☀' },
      { name: 'cloud',       ch: '☁' },
      { name: 'butterfly',   ch: '🦋' },
      { name: 'cherry',      ch: '🍒' },
      { name: 'lemon',       ch: '🍋' },
      { name: 'mushroom',    ch: '🍄' },
      { name: 'strawberry',  ch: '🍓' },
    ],
  },
];

const TAPES = [
  { name: 'mint',     color: '#b2dfdb', bg: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.3) 0 4px,transparent 4px 8px)' },
  { name: 'pink',     color: '#f8bbd0', bg: 'radial-gradient(circle,rgba(255,255,255,0.4) 2px,transparent 2px) 0 0/8px 8px' },
  { name: 'sky',      color: '#90caf9', bg: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.2) 0 3px,transparent 3px 9px)' },
  { name: 'lemon',    color: '#fff59d', bg: 'none' },
  { name: 'rose',     color: '#ef9a9a', bg: 'repeating-conic-gradient(rgba(255,255,255,0.2) 0% 25%,transparent 0% 50%) 0 0/10px 10px' },
  { name: 'violet',   color: '#ce93d8', bg: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.25) 0 3px,transparent 3px 6px)' },
  { name: 'sage',     color: '#a5d6a7', bg: 'radial-gradient(circle,rgba(255,255,255,0.3) 2px,transparent 2px) 0 0/7px 7px' },
  { name: 'peach',    color: '#ffcc80', bg: 'none' },
];

const TEXT_SNIPPETS = [
  '"do better."',
  '"you can."',
  'carpe diem',
  'golden hour',
  'wild & free',
  '& so it goes',
  'tender loving',
  'soft morning',
  'forever ago',
  '7 8 9 10',
];

let _seq = 1;
const uid = () => `mb${_seq++}`;

const buildItems = (data, layout = 'editorial') => {
  const slots = LAYOUT_SLOTS[layout] || LAYOUT_SLOTS.editorial;
  const out = [];
  let z = 1;

  (data.palette || []).slice(0, 5).forEach((color, i) => {
    out.push({ id: uid(), type: 'palette', color, x: 14 + i * 50, y: 14, w: 36, h: 36, r: 0, z: z++ });
  });

  out.push({
    id: uid(), type: 'text',
    label: data.vibeTitle || 'My Moodboard',
    sub: data.vibeDescription || '',
    x: 14, y: 68, w: 320, h: 88, r: 0, z: z + 30,
  });
  z++;

  (data.images || []).slice(0, 8).forEach((img, i) => {
    const s = slots[i] || slots[i % slots.length];
    out.push({
      id: uid(), type: 'image',
      src: img.url, thumb: img.thumb, credit: img.photographer, keyword: img.keyword,
      x: Math.round(s.xp * CW), y: Math.round(s.yp * CH),
      w: Math.round(s.wp * CW), h: Math.round(s.hp * CH),
      r: s.r, z: z++,
    });
  });

  const kw = data.keywords?.[0];
  if (kw) {
    out.push({ id: uid(), type: 'note', label: kw, x: 370, y: 22, w: 220, h: 28, r: -7, z: z++ });
  }
  if (data.vibeDescription) {
    out.push({
      id: uid(), type: 'note',
      label: data.vibeDescription,
      x: 16, y: CH - 52, w: 260, h: 40, r: 3, z: z++,
    });
  }
  return out;
};

/* ─── Component ──────────────────────────────────────── */
const MoodboardPage = () => {
  const { vibeData } = useMoodTheme();
  const vibePrompt = vibeData?.prompt || '';

  const [activePrompt, setActivePrompt]   = useState(vibePrompt);
  const [editing, setEditing]             = useState(false);
  const [editDraft, setEditDraft]         = useState(vibePrompt);

  const [loading, setLoading]             = useState(false);
  const [mbData, setMbData]               = useState(null);
  const [items, setItems]                 = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [bg, setBg]                       = useState('paper');
  const [layout, setLayout]               = useState('editorial');
  const [exporting, setExporting]         = useState(false);
  const [scale, setScale]                 = useState(1);

  const canvasRef       = useRef(null);
  const containerRef    = useRef(null);
  const dragRef         = useRef(null);
  const scaleRef        = useRef(1);
  const generatedForRef = useRef(null);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / CW);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const s = scaleRef.current;
      const dx = (e.clientX - d.sx) / s;
      const dy = (e.clientY - d.sy) / s;
      setItems((prev) => prev.map((it) => (it.id === d.id ? { ...it, x: d.ix + dx, y: d.iy + dy } : it)));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  useEffect(() => {
    if (vibePrompt && generatedForRef.current !== vibePrompt) {
      setActivePrompt(vibePrompt);
      setEditDraft(vibePrompt);
      runGenerate(vibePrompt, 'editorial');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vibePrompt]);

  /* ── Core generate ── */
  const runGenerate = async (promptText, currentLayout = layout) => {
    const value = String(promptText || '').trim();
    if (!value || loading) return;
    setLoading(true);
    setMbData(null);
    setItems([]);
    setSelectedId(null);
    generatedForRef.current = value;
    try {
      const { data } = await api.post('/moodboard/generate', { prompt: value });
      setMbData(data.data);
      setItems(buildItems(data.data, currentLayout));
    } catch (err) {
      generatedForRef.current = null;
      toast.error(err.response?.data?.message || 'Failed to generate moodboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => runGenerate(activePrompt, layout);

  const handleEditSave = () => {
    const value = editDraft.trim();
    if (!value) return;
    setActivePrompt(value);
    setEditing(false);
    runGenerate(value, layout);
  };

  /* ── Apply layout (repositions existing images) ── */
  const applyLayout = (newLayout) => {
    setLayout(newLayout);
    const slots = LAYOUT_SLOTS[newLayout] || LAYOUT_SLOTS.editorial;
    setItems((prev) => {
      let imgIdx = 0;
      return prev.map((item) => {
        if (item.type !== 'image') return item;
        const slot = slots[imgIdx % slots.length];
        imgIdx++;
        return {
          ...item,
          x: Math.round(slot.xp * CW),
          y: Math.round(slot.yp * CH),
          w: Math.round(slot.wp * CW),
          h: Math.round(slot.hp * CH),
          r: slot.r,
        };
      });
    });
  };

  /* ── Drag start ── */
  const startDrag = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const item = items.find((it) => it.id === id);
    if (!item) return;
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ix: item.x, iy: item.y };
    setSelectedId(id);
    setItems((prev) => {
      const maxZ = Math.max(1, ...prev.map((p) => p.z || 0));
      return prev.map((it) => (it.id === id ? { ...it, z: maxZ + 1 } : it));
    });
  };

  const addImage = (img) => {
    setItems((prev) => [...prev, {
      id: uid(), type: 'image',
      src: img.url, thumb: img.thumb, credit: img.photographer,
      x: Math.round(CW * 0.15 + Math.random() * CW * 0.35),
      y: Math.round(CH * 0.22 + Math.random() * CH * 0.35),
      w: 220, h: 156,
      r: Math.random() * 8 - 4,
      z: Math.max(1, ...prev.map((p) => p.z || 0)) + 1,
    }]);
  };

  const addSticker = (s) => {
    setItems((prev) => [...prev, {
      id: uid(), type: 'sticker', label: s.ch, name: s.name,
      x: Math.round(CW * 0.3 + Math.random() * CW * 0.28),
      y: Math.round(CH * 0.3 + Math.random() * CH * 0.32),
      w: 52, h: 52,
      r: Math.random() * 22 - 11,
      z: Math.max(1, ...prev.map((p) => p.z || 0)) + 1,
    }]);
  };

  const addTape = (tape) => {
    setItems((prev) => [...prev, {
      id: uid(), type: 'tape',
      color: tape.color, bgPattern: tape.bg,
      x: Math.round(CW * 0.12 + Math.random() * CW * 0.38),
      y: Math.round(CH * 0.22 + Math.random() * CH * 0.42),
      w: 110 + Math.round(Math.random() * 70), h: 22,
      r: Math.random() * 18 - 9,
      z: Math.max(1, ...prev.map((p) => p.z || 0)) + 1,
    }]);
  };

  const addSnippet = (text) => {
    setItems((prev) => [...prev, {
      id: uid(), type: 'snippet', label: text,
      x: Math.round(CW * 0.2 + Math.random() * CW * 0.32),
      y: Math.round(CH * 0.28 + Math.random() * CH * 0.36),
      w: 130, h: 34,
      r: Math.random() * 10 - 5,
      z: Math.max(1, ...prev.map((p) => p.z || 0)) + 1,
    }]);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((it) => it.id !== selectedId));
    setSelectedId(null);
  };

  const handleDownload = async () => {
    if (!canvasRef.current || exporting) return;
    setExporting(true);
    try {
      const h2c = (await import('html2canvas')).default;
      const canvas = await h2c(canvasRef.current, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
      });
      const link = document.createElement('a');
      link.download = `${(mbData?.vibeTitle || 'moodboard').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Moodboard downloaded');
    } catch {
      toast.error('Export failed — try right-clicking the canvas to save');
    } finally {
      setExporting(false);
    }
  };

  const bgCfg  = BACKGROUNDS[bg] || BACKGROUNDS.paper;
  const isDark = bg === 'dark';

  const imgStyle = (() => {
    const base = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
    switch (layout) {
      case 'pinterest': return { ...base, borderRadius: 12 };
      case 'diary':     return { ...base, filter: 'sepia(30%) contrast(1.06) saturate(0.88)' };
      default:          return base;
    }
  })();

  const boxShadow = (() => {
    switch (layout) {
      case 'cutout':    return '6px 6px 0 rgba(0,0,0,0.30)';
      case 'pinterest': return '0 8px 28px rgba(0,0,0,0.12)';
      case 'diary':     return '2px 4px 14px rgba(0,0,0,0.18), 0 0 0 7px rgba(255,255,255,0.75)';
      default:          return '0 5px 22px rgba(0,0,0,0.18)';
    }
  })();

  const renderItem = (item) => {
    const isSelected = selectedId === item.id;
    const base = {
      position: 'absolute',
      left: item.x, top: item.y, width: item.w, height: item.h,
      transform: `rotate(${item.r || 0}deg)`,
      zIndex: item.z || 1,
      cursor: 'grab', userSelect: 'none', touchAction: 'none',
      outline: isSelected ? '2px solid rgba(99,102,241,0.9)' : 'none',
      outlineOffset: isSelected ? 3 : 0,
    };
    const handlers = {
      onPointerDown: (e) => startDrag(e, item.id),
      onClick: (e) => e.stopPropagation(),
    };

    if (item.type === 'image') {
      return (
        <div key={item.id} style={{ ...base, overflow: 'hidden', boxShadow }} {...handlers}>
          <img src={item.src} alt={item.credit || ''} crossOrigin="anonymous" style={imgStyle} draggable={false} />
        </div>
      );
    }
    if (item.type === 'palette') {
      return (
        <div key={item.id}
          style={{ ...base, borderRadius: '50%', backgroundColor: item.color, boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }}
          {...handlers}
        />
      );
    }
    if (item.type === 'text') {
      return (
        <div key={item.id} style={base} {...handlers}>
          <h2 style={{
            margin: 0, lineHeight: 1.05, letterSpacing: '-0.025em',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 26, fontWeight: 700, color: bgCfg.fg,
            textShadow: isDark ? 'none' : '0 1px 8px rgba(255,255,255,0.7)',
          }}>
            {item.label}
          </h2>
          {item.sub && (
            <p style={{
              margin: '5px 0 0', fontSize: 10.5, fontStyle: 'italic',
              color: isDark ? '#aaa' : '#666',
              fontFamily: 'Georgia, serif', lineHeight: 1.45,
            }}>
              {item.sub}
            </p>
          )}
        </div>
      );
    }
    if (item.type === 'sticker') {
      return (
        <div key={item.id}
          style={{ ...base, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          {...handlers}
        >
          {item.label}
        </div>
      );
    }
    if (item.type === 'tape') {
      return (
        <div key={item.id}
          style={{
            ...base,
            backgroundColor: item.color,
            backgroundImage: item.bgPattern && item.bgPattern !== 'none' ? item.bgPattern : undefined,
            opacity: 0.82,
            borderRadius: 2,
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))',
          }}
          {...handlers}
        />
      );
    }
    if (item.type === 'snippet') {
      return (
        <div key={item.id}
          style={{
            ...base,
            fontFamily: '"Courier New", monospace',
            fontSize: 11,
            background: 'rgba(255,255,200,0.9)',
            padding: '3px 7px',
            border: '1px solid rgba(0,0,0,0.1)',
            lineHeight: 1.35,
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: 2,
            boxShadow: '1px 2px 6px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          {...handlers}
        >
          {item.label}
        </div>
      );
    }
    if (item.type === 'note') {
      return (
        <div key={item.id}
          style={{
            ...base,
            fontFamily: '"Brush Script MT", "Segoe Script", cursive',
            fontSize: 13, lineHeight: 1.3, overflow: 'hidden',
            color: isDark ? 'rgba(245,240,232,0.65)' : 'rgba(40,30,20,0.6)',
          }}
          {...handlers}
        >
          {item.label}
        </div>
      );
    }
    return null;
  };

  /* ─── Empty state ───────────────────────────────────── */
  if (!vibePrompt) {
    return (
      <div className="mb-page">
        <h1 className="mb-page-title">Moodboard</h1>
        <div className="mb-empty-state">
          <div className="mb-empty-orb" aria-hidden />
          <h2>Your moodboard is waiting.</h2>
          <p>Start by creating a vibe first — the moodboard will build itself from your mood.</p>
          <Link to="/vibe" className="mb-empty-cta">Go to Vibe page</Link>
        </div>
      </div>
    );
  }

  /* ─── Main studio ───────────────────────────────────── */
  return (
    <div className="mb-page">
      <h1 className="mb-page-title">Moodboard</h1>

      {/* ── Editor (always present so header aligns with canvas) ── */}
      <div className="mb-editor">

        {/* Canvas column — ref here so ResizeObserver fires on mount, not when mbData loads */}
        <div className="mb-canvas-col" ref={containerRef}>

          {/* Prompt header */}
          <header className="mb-prompt-header">
            <div className="mb-prompt-meta">
              <span className="mb-prompt-label">Moodboard for</span>
              {editing ? (
                <div className="mb-prompt-edit-row">
                  <textarea
                    className="mb-prompt-edit-input"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={2}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditSave(); }}
                  />
                  <div className="mb-prompt-edit-actions">
                    <button className="mb-prompt-save-btn" onClick={handleEditSave} disabled={!editDraft.trim()}>
                      Generate
                    </button>
                    <button className="mb-prompt-cancel-btn" onClick={() => { setEditing(false); setEditDraft(activePrompt); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-prompt-pill-row">
                  <span className="mb-prompt-pill">{activePrompt}</span>
                  <button className="mb-prompt-edit-btn" onClick={() => { setEditing(true); setEditDraft(activePrompt); }}>
                    Edit mood
                  </button>
                </div>
              )}
            </div>

            {!editing && (
              <button className="mb-regen-btn" onClick={handleRegenerate} disabled={loading}>
                {loading ? <span className="mb-spinner" aria-hidden /> : null}
                {loading ? 'Generating…' : 'Regenerate moodboard'}
              </button>
            )}
          </header>

          {/* Loading */}
          {loading && (
            <div className="mb-loader">
              <div className="mb-loader-orb" aria-hidden />
              <p>Curating your moodboard…</p>
            </div>
          )}

          {/* Canvas + controls */}
          {mbData && !loading && (
            <>
              <div className="mb-canvas-container">
                <div style={{ width: CW * scale, height: CH * scale, position: 'relative', flexShrink: 0 }}>
                  <div
                    ref={canvasRef}
                    className="mb-canvas"
                    style={{
                      width: CW, height: CH,
                      backgroundColor: bgCfg.bg,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                      position: 'absolute', top: 0, left: 0,
                    }}
                    onClick={() => setSelectedId(null)}
                  >
                    <div className={`mb-texture mb-texture-${bg}`} aria-hidden />
                    {items.map(renderItem)}
                  </div>
                </div>
              </div>

              <div className="mb-controls">
                {selectedId && (
                  <button className="mb-ctrl-btn mb-ctrl-remove" onClick={removeSelected}>
                    Remove selected
                  </button>
                )}
                <button className="mb-ctrl-btn mb-ctrl-dl" onClick={handleDownload} disabled={exporting}>
                  {exporting ? 'Exporting…' : 'Download poster'}
                </button>
              </div>
            </>
          )}

        </div>{/* end mb-canvas-col */}

        {/* ── Panel (editorial sidebar card) ── */}
        {mbData && !loading && (
          <aside className="mb-panel">

            {/* Photo library */}
            <div className="mb-panel-block">
              <h3 className="mb-panel-label">Photo library</h3>
              <div className="mb-photo-grid">
                {(mbData.images || []).map((img) => (
                  <button key={img.id} className="mb-photo-btn" onClick={() => addImage(img)} title={img.keyword}>
                    <img src={img.thumb || img.url} alt="" crossOrigin="anonymous" />
                    <span aria-hidden>+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stickers */}
            <div className="mb-panel-block">
              <h3 className="mb-panel-label">Stickers</h3>
              {STICKER_GROUPS.map((group) => (
                <div key={group.label} className="mb-sticker-category">
                  <p className="mb-sticker-group-label">{group.label}</p>
                  <div className="mb-sticker-grid">
                    {group.items.map((s) => (
                      <button key={s.name} className="mb-sticker-btn" onClick={() => addSticker(s)} title={s.name}>
                        {s.ch}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Washi tape */}
            <div className="mb-panel-block">
              <h3 className="mb-panel-label">Washi tape</h3>
              <div className="mb-tape-grid">
                {TAPES.map((t) => (
                  <button
                    key={t.name}
                    className="mb-tape-btn"
                    style={{
                      backgroundColor: t.color,
                      backgroundImage: t.bg && t.bg !== 'none' ? t.bg : undefined,
                      opacity: 0.9,
                    }}
                    onClick={() => addTape(t)}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            {/* Text snippets */}
            <div className="mb-panel-block">
              <h3 className="mb-panel-label">Text snippets</h3>
              <div className="mb-snippet-grid">
                {TEXT_SNIPPETS.map((text) => (
                  <button key={text} className="mb-snippet-btn" onClick={() => addSnippet(text)}>
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout style */}
            <div className="mb-panel-block">
              <h3 className="mb-panel-label">Layout style</h3>
              <div className="mb-layout-list">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    className={`mb-layout-btn${layout === l.id ? ' is-on' : ''}`}
                    onClick={() => applyLayout(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="mb-panel-block">
              <h3 className="mb-panel-label">Background</h3>
              <div className="mb-bg-row">
                {Object.entries(BACKGROUNDS).map(([key, val]) => (
                  <button
                    key={key}
                    className={`mb-bg-dot${bg === key ? ' is-on' : ''}`}
                    style={{ background: val.bg }}
                    onClick={() => setBg(key)}
                    title={val.label}
                  />
                ))}
              </div>
              <span className="mb-bg-name">{bgCfg.label}</span>
            </div>

            {/* Palette */}
            <div className="mb-panel-block">
              <h3 className="mb-panel-label">Palette</h3>
              <div className="mb-palette-row">
                {(mbData.palette || []).map((c) => (
                  <span key={c} className="mb-palette-swatch" style={{ background: c }} title={c} />
                ))}
              </div>
            </div>

            {/* Vibe info */}
            <div className="mb-panel-block mb-vibe-card">
              <strong>{mbData.vibeTitle}</strong>
              <p>{mbData.vibeDescription}</p>
              <div className="mb-tag-row">
                {(mbData.keywords || []).map((k) => <em key={k}>#{k}</em>)}
              </div>
            </div>

          </aside>
        )}

      </div>{/* end mb-editor */}
    </div>
  );
};

export default MoodboardPage;
