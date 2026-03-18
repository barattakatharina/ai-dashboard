import { ContentItem } from '../types/index.js';
import { FeaturedCard } from './FeaturedCard.js';
import { ListItem } from './ListItem.js';

interface QuadrantProps {
  label: string;
  icon: string;
  items: ContentItem[];
  accentColor: string;
  onItemClick: (item: ContentItem) => void;
  onSave: (item: ContentItem) => void;
}

export function Quadrant({ label, icon, items, accentColor, onItemClick, onSave }: QuadrantProps) {
  const [featured, ...rest] = items;

  return (
    <div
      className="quadrant"
      style={{ '--q-accent': accentColor } as React.CSSProperties}
    >
      {/* Quadrant header */}
      <div className="quadrant-header">
        <span className="quadrant-icon">{icon}</span>
        <span className="quadrant-label">{label}</span>
        {items.length > 0 && (
          <span className="quadrant-count">{items.length}</span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="quadrant-scroll">
        {items.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No content yet</div>
            <div className="empty-state-text">Click Refresh to load content.</div>
          </div>
        )}

        {featured && (
          <FeaturedCard
            item={featured}
            accentColor={accentColor}
            onClick={onItemClick}
          />
        )}

        {rest.map(item => (
          <ListItem
            key={item.id}
            item={item}
            onClick={onItemClick}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}
