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
      <div className="header-logo">
        <span className="header-logo-icon">🤖</span>
        <span className="header-logo-text">AI <span>Pulse</span></span>
      </div>

      <div className="header-meta">
        {dashboard && (
          <>
            <div className="header-dot" />
            <span>Updated {timeAgo(dashboard.lastRefreshed)}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>{dashboard.totalItems} items</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>{dashboard.activeSources.length} sources</span>
          </>
        )}
      </div>

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

        <button className="btn btn-saved-count" onClick={onToggleSaved} title="Saved items">
          🔖 Saved
          {savedCount > 0 && <span className="badge">{savedCount}</span>}
        </button>
      </div>
    </header>
  );
}
