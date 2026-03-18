import { ContentItem } from '../types/index.js';

interface ListItemProps {
  item: ContentItem;
  onClick: (item: ContentItem) => void;
  onSave: (item: ContentItem) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ListItem({ item, onClick, onSave }: ListItemProps) {
  return (
    <div
      className="list-item"
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(item)}
    >
      <span className="list-item-dot" />

      <span className="list-item-title">{item.title}</span>

      <div className="list-item-meta">
        <span className="list-item-source">{item.source}</span>
        <span className="list-item-sep">·</span>
        <span className="list-item-time">{timeAgo(item.publishedAt)}</span>
      </div>

      <button
        className={`list-item-save${item.saved ? ' saved' : ''}`}
        onClick={e => { e.stopPropagation(); onSave(item); }}
        title={item.saved ? 'Saved' : 'Save for later'}
        aria-label={item.saved ? 'Remove from saved' : 'Save for later'}
      >
        🔖
      </button>
    </div>
  );
}
