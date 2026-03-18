import { useState } from 'react';
import { ContentItem } from '../types/index.js';

interface FeaturedCardProps {
  item: ContentItem;
  accentColor: string;
  onClick: (item: ContentItem) => void;
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

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  } catch {
    return '';
  }
}

export function FeaturedCard({ item, accentColor, onClick }: FeaturedCardProps) {
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  return (
    <div
      className="featured-card"
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(item)}
    >
      {item.imageUrl && !imgError ? (
        <img
          className="featured-card-image"
          src={item.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="featured-card-image-placeholder"
          style={{
            background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`,
            borderBottom: `1px solid ${accentColor}20`,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.3">
            <rect x="4" y="8" width="32" height="24" rx="3" stroke={accentColor} strokeWidth="2" />
            <circle cx="14" cy="18" r="3" fill={accentColor} />
            <path d="M4 28l8-8 6 6 6-8 12 10" stroke={accentColor} strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className="featured-card-body" style={{ borderLeftColor: accentColor }}>
        <div className="featured-card-source-row">
          {!faviconError && (
            <img
              className="featured-card-favicon"
              src={getFaviconUrl(item.url)}
              alt=""
              onError={() => setFaviconError(true)}
            />
          )}
          <span className="featured-card-source">{item.source}</span>
          <span className="featured-card-source-sep">·</span>
          <span className="featured-card-time">{timeAgo(item.publishedAt)}</span>
        </div>
        <div className="featured-card-title">{item.title}</div>
        {item.description && (
          <div className="featured-card-desc">{item.description}</div>
        )}
      </div>
    </div>
  );
}
