import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './services/api.js';
import { ContentItem, DashboardResponse, SavedItem } from './types/index.js';
import { Header } from './components/Header.js';
import { CategorySection } from './components/CategorySection.js';
import { DetailModal } from './components/DetailModal.js';
import { SavedPanel } from './components/SavedPanel.js';

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function App() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);

  // Dashboard content
  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

  // Saved items
  const { data: savedItems = [] } = useQuery<SavedItem[]>({
    queryKey: ['saved'],
    queryFn: api.getSaved,
    staleTime: 0,
  });

  // Manual refresh
  const refreshMutation = useMutation({
    mutationFn: api.refreshDashboard,
    onSuccess: data => {
      queryClient.setQueryData(['dashboard'], data);
    },
  });

  // Save / unsave
  const saveMutation = useMutation({
    mutationFn: async (item: ContentItem) => {
      if (item.saved) {
        await api.unsaveItem(item.id);
        return { ...item, saved: false };
      } else {
        await api.saveItem(item);
        return { ...item, saved: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] });
      // Optimistically toggle saved state in dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSave = useCallback((item: ContentItem) => {
    saveMutation.mutate(item);
    // Update selected item if open
    if (selectedItem?.id === item.id) {
      setSelectedItem(prev => prev ? { ...prev, saved: !prev.saved } : null);
    }
  }, [saveMutation, selectedItem]);

  const handleItemClick = useCallback((item: ContentItem) => {
    const savedId = savedItems.find(s => s.id === item.id);
    setSelectedItem({ ...item, saved: !!savedId });
  }, [savedItems]);

  const savedSet = new Set(savedItems.map(s => s.id));

  // Annotate dashboard items with saved state
  const annotatedDashboard: DashboardResponse | undefined = dashboard
    ? {
        ...dashboard,
        categories: dashboard.categories.map(cat => ({
          ...cat,
          items: cat.items.map(item => ({ ...item, saved: savedSet.has(item.id) })),
        })),
      }
    : undefined;

  // Auto-refresh check
  useEffect(() => {
    if (!dashboard?.nextRefresh) return;
    const msUntilRefresh = new Date(dashboard.nextRefresh).getTime() - Date.now();
    if (msUntilRefresh <= 0 || msUntilRefresh > 24 * 60 * 60 * 1000) return;

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }, msUntilRefresh + 5000);

    return () => clearTimeout(timer);
  }, [dashboard?.nextRefresh, queryClient]);

  if (isLoading) {
    return (
      <>
        <Header
          savedCount={0}
          isRefreshing={false}
          onRefresh={() => {}}
          onToggleSaved={() => {}}
        />
        <div className="loading-wrapper">
          <div className="loading-spinner" />
          <div className="loading-text">Aggregating AI news from across the web…</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            First load may take 15–30 seconds
          </div>
        </div>
      </>
    );
  }

  if (error && !dashboard) {
    return (
      <>
        <Header
          savedCount={savedItems.length}
          isRefreshing={false}
          onRefresh={() => refreshMutation.mutate()}
          onToggleSaved={() => setSavedPanelOpen(o => !o)}
        />
        <div className="error-state">
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-title">Couldn't load content</div>
          <div className="error-state-text">
            Make sure the backend server is running on port 3001.
            <br />
            {String(error)}
          </div>
          <button className="btn btn-primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}>
            Try Again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        dashboard={annotatedDashboard}
        savedCount={savedItems.length}
        isRefreshing={refreshMutation.isPending}
        onRefresh={() => refreshMutation.mutate()}
        onToggleSaved={() => setSavedPanelOpen(o => !o)}
      />

      <main className="main">
        {annotatedDashboard && (
          <>
            {/* Stats bar */}
            <div className="stats-bar">
              <div className="stats-bar-item">
                <span>📡</span>
                <span className="stats-bar-value">{annotatedDashboard.activeSources.length} sources</span>
                <span>active</span>
              </div>
              <div className="stats-bar-item">
                <span>📊</span>
                <span className="stats-bar-value">{annotatedDashboard.totalItems}</span>
                <span>items today</span>
              </div>
              <div className="stats-bar-item">
                <span>🕐</span>
                <span>Updated</span>
                <span className="stats-bar-value">{timeAgo(annotatedDashboard.lastRefreshed)}</span>
              </div>
              <div className="stats-bar-item">
                <span>⏭</span>
                <span>Next refresh</span>
                <span className="stats-bar-value">{timeUntil(annotatedDashboard.nextRefresh)}</span>
              </div>
              {annotatedDashboard.isStale && (
                <div className="stats-stale">⚠ Showing cached content — refresh in progress</div>
              )}
            </div>

            {/* Category sections */}
            {annotatedDashboard.categories.map(category => (
              <CategorySection
                key={category.id}
                category={category}
                onSave={handleSave}
                onItemClick={handleItemClick}
              />
            ))}

            {annotatedDashboard.categories.length === 0 && (
              <div className="empty-state" style={{ minHeight: '50vh' }}>
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No content loaded yet</div>
                <div className="empty-state-text">
                  Click Refresh to pull content from AI news sources, newsletters, podcasts, and more.
                </div>
                <button className="btn btn-primary" onClick={() => refreshMutation.mutate()}>
                  ↻ Load Content
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={item => {
            handleSave(item);
            setSelectedItem(prev => prev ? { ...prev, saved: !prev.saved } : null);
          }}
        />
      )}

      {/* Saved panel */}
      <SavedPanel
        isOpen={savedPanelOpen}
        items={savedItems}
        onClose={() => setSavedPanelOpen(false)}
        onItemClick={item => {
          setSavedPanelOpen(false);
          handleItemClick(item);
        }}
        onRemove={id => {
          const item = savedItems.find(s => s.id === id);
          if (item) handleSave({ ...item, saved: true });
        }}
      />
    </>
  );
}
