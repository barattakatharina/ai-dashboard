import { ContentItem, DashboardResponse, SavedItem } from '../types/index.js';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDashboard: (): Promise<DashboardResponse> =>
    request<DashboardResponse>('/content'),

  refreshDashboard: (): Promise<DashboardResponse> =>
    request<DashboardResponse>('/content/refresh', { method: 'POST' }),

  getSaved: (): Promise<SavedItem[]> =>
    request<SavedItem[]>('/saved'),

  saveItem: (item: ContentItem): Promise<{ success: boolean }> =>
    request('/saved', { method: 'POST', body: JSON.stringify(item) }),

  unsaveItem: (id: string): Promise<{ success: boolean }> =>
    request(`/saved/${id}`, { method: 'DELETE' }),
};
