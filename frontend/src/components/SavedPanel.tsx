import { useEffect } from 'react';
import { ContentItem, SavedItem } from '../types/index.js';

interface SavedPanelProps {
  isOpen: boolean;
  items: SavedItem[];
  onClose: () => void;
  onItemClick: (item: ContentItem) => void;
  onRemove: (id: string) => void;
}

const TYPE_EMOJI: Record<string, string> = {
  article: '📄', video: '▶', podcast: '🎧', newsletter: '📧', tool: '🛠',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SavedPanel({ isOpen, items, onClose, onItemClick, onRemove }: SavedPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && <div className="panel-backdrop" onClick={onClose} />}
      <aside className={`saved-panel ${isOpen ? 'open' : ''}`}>
        <div className="saved-panel-header">
          <h2 className="saved-panel-title">🔖 Saved Items ({items.length})</h2>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="saved-panel-list">
          {items.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">Nothing saved yet</div>
              <div className="empty-state-text">
                Click the bookmark icon on any article, video, or podcast to save it here.
              </div>
            </div>
          )}

          {items.map(item => (
            <div
              key={item.id}
              className="saved-card"
              onClick={() => onItemClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onItemClick(item)}
            >
              {item.imageUrl ? (
                <img
                  className="saved-card-img"
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="saved-card-img-placeholder">
                  {TYPE_EMOJI[item.type] || '📄'}
                </div>
              )}

              <div className="saved-card-content">
                <div className="saved-card-title">{item.title}</div>
                <div className="saved-card-meta">
                  {item.source} · {timeAgo(item.savedAt)}
                </div>
              </div>

              <button
                className="saved-card-remove"
                onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                title="Remove from saved"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
