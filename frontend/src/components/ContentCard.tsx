import { useState } from 'react';
import { ContentItem } from '../types/index.js';

interface ContentCardProps {
  item: ContentItem;
  onSave: (item: ContentItem) => void;
  onClick: (item: ContentItem) => void;
}

const TYPE_EMOJI: Record<string, string> = {
  article: '📄',
  video: '▶',
  podcast: '🎧',
  newsletter: '📧',
  tool: '🛠',
};

const CATEGORY_GRADIENT: Record<string, string> = {
  'top-stories': 'linear-gradient(135deg, #1a2a4a 0%, #0d1117 100%)',
  newsletters: 'linear-gradient(135deg, #2a1f0d 0%, #0d1117 100%)',
  videos: 'linear-gradient(135deg, #2a1414 0%, #0d1117 100%)',
  podcasts: 'linear-gradient(135deg, #1e1530 0%, #0d1117 100%)',
  tools: 'linear-gradient(135deg, #102a14 0%, #0d1117 100%)',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

export function ContentCard({ item, onSave, onClick }: ContentCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="card" onClick={() => onClick(item)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(item)}>
      {item.imageUrl && !imgError ? (
        <img
          className="card-image"
          src={item.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="card-image-placeholder"
          style={{ background: CATEGORY_GRADIENT[item.category] || CATEGORY_GRADIENT['top-stories'] }}
        >
          {TYPE_EMOJI[item.type] || '📄'}
        </div>
      )}

      <div className="card-body">
        <div className="card-badges">
          <span className={`badge badge-type ${item.type}`}>{item.type}</span>
          {item.score && item.score > 50 && (
            <span className="card-hn-score">▲ {item.score}</span>
          )}
          {item.duration && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⏱ {item.duration}</span>
          )}
        </div>

        <h3 className="card-title">{item.title}</h3>
        <p className="card-description">{item.description}</p>

        <div className="card-footer">
          <div className="card-source">
            <img
              className="card-favicon"
              src={getFaviconUrl(item.url)}
              alt=""
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="card-source-name">{item.source}</span>
            <span className="card-time">· {timeAgo(item.publishedAt)}</span>
          </div>

          <div className="card-actions">
            <button
              className={`card-save-btn ${item.saved ? 'saved' : ''}`}
              onClick={e => { e.stopPropagation(); onSave(item); }}
              title={item.saved ? 'Remove from saved' : 'Save for later'}
            >
              {item.saved ? '🔖' : '🔖'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
