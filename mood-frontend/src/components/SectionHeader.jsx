// SectionHeader — eyebrow + title + optional caption used at the top of each results section
const SectionHeader = ({ eyebrow, title, caption, action }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div className="min-w-0">
      {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
      <h2 className="section-title mt-2">{title}</h2>
      {caption && <p className="mt-1 max-w-xl text-sm text-ink-400">{caption}</p>}
    </div>
    {action && <div>{action}</div>}
  </header>
);

export default SectionHeader;
