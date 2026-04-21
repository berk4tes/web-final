// ResultsGrid — 3-column grid that swaps between skeletons, empty state, and result cards
import EmptyState from './EmptyState';
import ResultCard from './ResultCard';
import SkeletonCard from './SkeletonCard';

const ResultsGrid = ({ items, loading, isFavorite, onToggleFavorite, emptyTitle, emptyDescription }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon="🎬"
        title={emptyTitle || 'Henüz öneri yok'}
        description={emptyDescription || 'Bir mood seçip "Önerileri Al" butonuna bas.'}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 animate-fade-in sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ResultCard
          key={item._id || item.externalId || item.title}
          item={item}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default ResultsGrid;
