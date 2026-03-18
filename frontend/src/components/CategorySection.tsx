import { Category, ContentItem } from '../types/index.js';
import { ContentCard } from './ContentCard.js';

interface CategorySectionProps {
  category: Category;
  onSave: (item: ContentItem) => void;
  onItemClick: (item: ContentItem) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'top-stories': 'var(--cat-top-stories)',
  newsletters: 'var(--cat-newsletters)',
  videos: 'var(--cat-videos)',
  podcasts: 'var(--cat-podcasts)',
  tools: 'var(--cat-tools)',
};

export function CategorySection({ category, onSave, onItemClick }: CategorySectionProps) {
  const color = CATEGORY_COLORS[category.id] || 'var(--accent-blue)';

  return (
    <section className="category-section">
      <div className="category-header">
        <div className="category-title">
          <div className="category-strip" style={{ background: color }} />
          <span className="category-emoji">{category.emoji}</span>
          <h2 className="category-label">{category.label}</h2>
          <span className="category-count">{category.items.length}</span>
        </div>
      </div>

      <div className="category-scroll">
        {category.items.map(item => (
          <ContentCard
            key={item.id}
            item={item}
            onSave={onSave}
            onClick={onItemClick}
          />
        ))}
      </div>
    </section>
  );
}
