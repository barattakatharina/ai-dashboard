import { useEffect, useState } from 'react';
import { ContentItem } from '../types/index.js';

interface DetailModalProps {
  item: ContentItem;
  onClose: () => void;
  onSave: (item: ContentItem) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function DetailModal({ item, onClose, onSave }: DetailModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={e => e.stopPropagation()}>
        {item.imageUrl && !imgError && (
          <div className="modal-image-wrapper">
            <img
              className="modal-image"
              src={item.imageUrl}
              alt=""
              onError={() => setImgError(true)}
            />
            <button className="modal-close" onClick={onClose} title="Close">✕</button>
          </div>
        )}

        {(!item.imageUrl || imgError) && (
          <button
            className="modal-close"
            onClick={onClose}
            style={{ position: 'relative', alignSelf: 'flex-end', margin: '12px 12px 0 0', top: 0, right: 0 }}
            title="Close"
          >
            ✕
          </button>
        )}

        <div className="modal-body">
          <div className="modal-badges">
            <span className={`badge badge-type ${item.type}`}>{item.type}</span>
            <span className="badge" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {item.source}
            </span>
            {item.score && (
              <span className="card-hn-score">▲ {item.score} points</span>
            )}
          </div>

          <h2 className="modal-title">{item.title}</h2>

          <div className="modal-meta">
            {item.author && <span>{item.author}</span>}
            {item.author && <span className="modal-meta-sep">·</span>}
            <span>{formatDate(item.publishedAt)}</span>
            {item.duration && (
              <>
                <span className="modal-meta-sep">·</span>
                <span>⏱ {item.duration}</span>
              </>
            )}
          </div>

          <p className="modal-description">{item.description}</p>

          <div className="modal-footer">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              onClick={e => e.stopPropagation()}
            >
              {item.type === 'video' ? '▶ Watch on YouTube' :
               item.type === 'podcast' ? '🎧 Listen to Episode' :
               '→ Read Full Article'}
            </a>

            <button
              className="btn btn-outline"
              onClick={() => onSave(item)}
              style={item.saved ? { borderColor: 'var(--q4)', color: 'var(--q4)' } : {}}
            >
              {item.saved ? '🔖 Saved' : '🔖 Save for Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
