// SkeletonCard — shimmer placeholder used during list loads
const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="aspect-[2/3] w-full rounded-2xl bg-ink-100" />
    <div className="mt-4 h-4 w-3/4 rounded bg-ink-100" />
    <div className="mt-2 h-3 w-1/2 rounded bg-ink-100" />
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full rounded bg-ink-100" />
      <div className="h-3 w-5/6 rounded bg-ink-100" />
    </div>
  </div>
);

export default SkeletonCard;
