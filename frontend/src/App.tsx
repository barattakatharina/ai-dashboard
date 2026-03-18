import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './services/api.js';
import { ContentItem, DashboardResponse, SavedItem } from './types/index.js';
import { Header } from './components/Header.js';
import { Quadrant } from './components/Quadrant.js';
import { DetailModal } from './components/DetailModal.js';
import { SavedPanel } from './components/SavedPanel.js';

// Quadrant accent colors
const Q1_COLOR = '#7C6FFF'; // AI News & Tools
const Q2_COLOR = '#00C8F8'; // Articles & Analysis
const Q3_COLOR = '#FF6B9D'; // Podcasts
const Q4_COLOR = '#FF8F3E'; // YouTube

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
    staleTime: 10 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSave = useCallback((item: ContentItem) => {
    saveMutation.mutate(item);
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

  // Helper: get items for a category by ID
  function getCategoryItems(catId: string): ContentItem[] {
    if (!annotatedDashboard) return [];
    const cat = annotatedDashboard.categories.find(c => c.id === catId);
    return cat?.items ?? [];
  }

  // Q1: top-stories + tools merged
  const q1Items: ContentItem[] = [
    ...getCategoryItems('top-stories'),
    ...getCategoryItems('tools'),
  ];

  // Q2: newsletters
  const q2Items: ContentItem[] = getCategoryItems('newsletters');

  // Q3: podcasts
  const q3Items: ContentItem[] = getCategoryItems('podcasts');

  // Q4: videos
  const q4Items: ContentItem[] = getCategoryItems('videos');

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

      <div className="app-grid">
        {/* Q1: AI News & Tools */}
        <Quadrant
          label="AI News & Tools"
          items={q1Items}
          accentColor={Q1_COLOR}
          onItemClick={handleItemClick}
          onSave={handleSave}
        />

        {/* Q2: Articles & Analysis */}
        <Quadrant
          label="Articles & Analysis"
          items={q2Items}
          accentColor={Q2_COLOR}
          onItemClick={handleItemClick}
          onSave={handleSave}
        />

        {/* Q3: Podcasts */}
        <Quadrant
          label="Podcasts"
          items={q3Items}
          accentColor={Q3_COLOR}
          onItemClick={handleItemClick}
          onSave={handleSave}
        />

        {/* Q4: YouTube */}
        <Quadrant
          label="YouTube"
          items={q4Items}
          accentColor={Q4_COLOR}
          onItemClick={handleItemClick}
          onSave={handleSave}
        />
      </div>

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
