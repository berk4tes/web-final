const DefaultIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b9b4a4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const EmptyState = ({ icon, title, description, action }) => (
  <div className="card flex flex-col items-center justify-center py-12 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
      {icon ? <span className="text-3xl">{icon}</span> : <DefaultIcon />}
    </div>
    <h3 className="mt-4 font-display text-xl font-semibold text-ink-700">{title}</h3>
    {description && <p className="mt-1 max-w-md text-sm text-ink-400">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
