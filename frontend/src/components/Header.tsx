import { DashboardResponse } from '../types/index.js';

interface HeaderProps {
  dashboard?: DashboardResponse;
  savedCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleSaved: () => void;
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

export function Header({ dashboard, savedCount, isRefreshing, onRefresh, onToggleSaved }: HeaderProps) {
  return (
    <header className="header">
      {/* Logo + wordmark */}
      <div className="header-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="url(#logoGrad)" />
          {/* Letter E: vertical bar + 3 horizontal bars */}
          <rect x="8" y="9" width="2" height="14" fill="white" />
          <rect x="8" y="9" width="9" height="2" fill="white" />
          <rect x="8" y="15" width="7" height="2" fill="white" />
          <rect x="8" y="21" width="9" height="2" fill="white" />
          {/* Connection line to neural dot */}
          <line x1="19" y1="16" x2="22.5" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          {/* Neural dot */}
          <circle cx="25" cy="16" r="2.5" fill="white" />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C6FFF" />
              <stop offset="100%" stopColor="#00C8F8" />
            </linearGradient>
          </defs>
        </svg>
        <span className="header-wordmark">
          Everything<span className="header-wordmark-ai"> AI</span>
        </span>
      </div>

      {/* Center meta */}
      <div className="header-meta">
        {dashboard ? (
          <>
            <span className="header-live-dot" />
            <span>{dashboard.activeSources.length} sources</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>{dashboard.totalItems} items</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>updated {timeAgo(dashboard.lastRefreshed)}</span>
          </>
        ) : (
          <>
            <span className="header-live-dot" style={{ background: 'var(--text-muted)', animationPlayState: 'paused' }} />
            <span>Loading…</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="header-actions">
        <button
          className="btn btn-ghost"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh content"
        >
          <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}>
            ↻
          </span>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>

        <button className="btn btn-saved" onClick={onToggleSaved} title="Saved items">
          🔖
          {savedCount > 0
            ? <span className="badge-count">{savedCount}</span>
            : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Saved</span>
          }
        </button>
      </div>
    </header>
  );
}
