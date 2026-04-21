// EmptyState — friendly placeholder for empty lists
const EmptyState = ({ icon = '✨', title, description, action }) => (
  <div className="card flex flex-col items-center justify-center py-12 text-center">
    <div className="text-5xl">{icon}</div>
    <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
    {description && <p className="mt-1 max-w-md text-sm text-slate-400">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
