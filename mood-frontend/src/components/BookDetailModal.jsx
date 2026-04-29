import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useUserPreferences } from '../context/UserPreferencesContext';

const COVER_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 160 240%22><rect width=%22160%22 height=%22240%22 fill=%22%23faf0d4%22/></svg>';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const BookDetailModal = ({ item, onClose, isFavorite, onToggleFavorite }) => {
  const { t } = useUserPreferences();
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  const favKey = item.externalId || item.title;
  const favored = isFavorite?.(favKey);
  const titleCover = item.title
    ? `https://covers.openlibrary.org/b/title/${encodeURIComponent(item.title)}-L.jpg?default=false`
    : COVER_PLACEHOLDER;

  const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(item.title)}`;

  const handleSaveToLibrary = () => {
    if (favored) return;
    onToggleFavorite?.({
      contentType: 'book',
      externalId: favKey,
      title: item.title,
      thumbnail: item.poster,
    });
    if (!favored) {
      toast.success(t('savedToLibrary'));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink-800/55 p-4 backdrop-blur-sm animate-fade-in sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-surface relative max-h-[min(680px,90vh)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-3xl shadow-2xl animate-slide-up"
      >
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink-600 shadow-soft transition hover:bg-white"
        >
          <CloseIcon />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          <div className="relative h-56 w-full overflow-hidden bg-ink-100 sm:h-64 md:sticky md:top-0 md:h-[min(500px,82vh)] md:aspect-auto">
            <img
              src={item.poster || titleCover}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                if (e.currentTarget.src !== COVER_PLACEHOLDER) e.currentTarget.src = COVER_PLACEHOLDER;
              }}
            />
          </div>

          <div className="p-6 sm:p-8">
            <span className="section-eyebrow">{t('book')}</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">
              {item.title}
            </h2>
            {item.overview && (
              <p className="mt-1 text-sm text-ink-500">{item.overview}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {item.genre && <span className="chip">{item.genre}</span>}
            </div>

            {item.aiExplanation && (
              <p className="mt-5 text-sm italic leading-relaxed text-ink-500">
                "{item.aiExplanation}"
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                onClick={handleSaveToLibrary}
                className={favored ? 'btn-secondary' : 'btn-primary'}
              >
                {favored ? t('savedToLibrary') : t('saveToLibrary')}
              </button>
              <a href={goodreadsUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                Goodreads
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BookDetailModal;
