import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      downloads: [],
      history: [],
      settings: {
        downloadPath: '',
        quality: 'best',
        autoDownload: true,
        maxConcurrentDownloads: 0
      },
      
      addDownload: (download) => set((state) => {
        const status = state.settings.autoDownload ? 'queued' : 'pending';
        return {
          downloads: [...state.downloads, { ...download, id: Date.now(), status, progress: 0 }]
        };
      }),
      
      updateDownload: (id, updates) => set((state) => ({
        downloads: state.downloads.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      
      removeDownload: (id) => set((state) => ({
        downloads: state.downloads.filter(d => d.id !== id)
      })),
      
      clearQueue: () => set({ downloads: [] }),
      
      addToHistory: (item) => set((state) => ({
        history: [{ ...item, id: Date.now(), timestamp: Date.now(), rating: 0 }, ...state.history]
      })),
      
      updateHistoryRating: (id, rating) => set((state) => ({
        history: state.history.map(h => h.id === id ? { ...h, rating } : h)
      })),
      
      removeFromHistory: (id) => set((state) => ({
        history: state.history.filter(h => h.id !== id)
      })),
      
      clearHistory: () => set({ history: [] }),
      
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      }))
    }),
    {
      name: 'localfap-storage',
    }
  )
);
