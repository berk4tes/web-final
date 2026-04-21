// SkeletonCard — shimmer placeholder shown while recommendations are loading
const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="aspect-[2/3] w-full rounded-xl bg-slate-800" />
    <div className="mt-4 h-4 w-3/4 rounded bg-slate-800" />
    <div className="mt-2 h-3 w-1/2 rounded bg-slate-800" />
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full rounded bg-slate-800" />
      <div className="h-3 w-5/6 rounded bg-slate-800" />
    </div>
  </div>
);

export default SkeletonCard;
