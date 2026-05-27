import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Lazy accessor — always reads window.saucebox at call-time so the Electron
// contextBridge is never missed due to module-load timing.
// Falls back to an HTTP shim only when running headless (Docker/web mode).
const webShim = (() => {
  const listenerMap = new Map();
  let eventSource = null;
  return {
    platform: 'web',
    invoke: async (channel, ...args) => {
      const res = await fetch('/api/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, args })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      return data.result;
    },
    send: (channel, ...args) => {
      fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, args })
      }).catch(console.error);
    },
    on: (channel, listener) => {
      if (!eventSource) {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            const listeners = listenerMap.get(data.channel) || [];
            listeners.forEach(fn => fn({}, ...(data.args || [])));
          } catch (err) {
            console.error('Failed to parse SSE data', err);
          }
        };
      }
      if (!listenerMap.has(channel)) listenerMap.set(channel, []);
      listenerMap.get(channel).push(listener);
    },
    removeListener: (channel, listener) => {
      if (listenerMap.has(channel)) {
        listenerMap.set(channel, listenerMap.get(channel).filter(fn => fn !== listener));
      }
    }
  };
})();

const getSaucebox = () => window.saucebox || webShim;

const DEFAULT_SETTINGS = {
  downloadPath: '',
  quality: 'best',
  autoDownload: true,
  autoStartBroadcast: false,
  maxConcurrentDownloads: 0,
  downloadSpeedLimit: 0,
  autoClearCompleted: false,
  systemNotifications: true,
  preferredContainer: 'mp4',
  proxyString: '',
  vaultEnabled: false,
  vaultPin: '0000',
  stealthHotkey: 'CommandOrControl+Shift+H',
  stealthPauseDownloads: false,
  stealthMuteNotifications: true,
  autoTagDomainUploader: true,
  minFreeSpaceGB: 5,
  ytdlpPath: '',
  ffmpegPath: '',
  binaryManagementMode: 'managed',
  autoUpdateBinaries: true,
  customPlayerPath: ''
};

export const useStore = create(
  persist(
    (set) => ({
      downloads: [],
      history: [],
      playlists: [],
      serverStatus: { running: false, url: null },
      setServerStatus: (status) => set({ serverStatus: status }),
      broadcastLogs: [],
      addBroadcastLog: (log) => set((state) => ({ 
        broadcastLogs: [log, ...state.broadcastLogs].slice(0, 50) 
      })),
      clearBroadcastLogs: () => set({ broadcastLogs: [] }),
      quickCastVideo: null,
      setQuickCastVideo: (video) => set({ quickCastVideo: video }),
      activeBuiltinVideo: null,
      setActiveBuiltinVideo: (video) => set({ activeBuiltinVideo: video }),
      settings: DEFAULT_SETTINGS,
      
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      
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
        history: [{ ...item, id: Date.now(), timestamp: Date.now(), rating: item.rating || 0, tags: item.tags || [] }, ...state.history]
      })),
      
      importVideos: (videos) => set((state) => {
        const timestamp = Date.now();
        const items = videos.map((v, i) => ({
          ...v,
          id: timestamp + i,
          timestamp: timestamp + i,
          rating: v.rating || 0,
          tags: v.tags || [],
          status: 'completed'
        }));
        return { history: [...items, ...state.history] };
      }),
      
      updateHistoryItem: (id, updates) => set((state) => ({
        history: state.history.map(h => h.id === id ? { ...h, ...updates } : h)
      })),

      updateHistoryRating: (id, rating) => set((state) => ({
        history: state.history.map(h => h.id === id ? { ...h, rating } : h)
      })),
      
      addTagToHistory: (id, tag) => set((state) => ({
        history: state.history.map(h => h.id === id ? { ...h, tags: [...(h.tags || []), tag] } : h)
      })),
      
      removeTagFromHistory: (id, tag) => set((state) => ({
        history: state.history.map(h => h.id === id ? { ...h, tags: (h.tags || []).filter(t => t !== tag) } : h)
      })),
      
      removeFromHistory: (id) => set((state) => ({
        history: state.history.filter(h => h.id !== id)
      })),
      
      clearHistory: () => set({ history: [] }),

      // Playlist Actions
      addPlaylist: (playlist) => set((state) => ({
        playlists: [{ ...playlist, id: Date.now(), createdAt: Date.now() }, ...state.playlists]
      })),

      updatePlaylist: (id, updates) => set((state) => ({
        playlists: state.playlists.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),
      
      clearPlaylists: () => set({ playlists: [] }),
      
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      }))
    }),
    {
      name: 'saucebox-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          return await getSaucebox().invoke('load-state', name);
        },
        setItem: async (name, value) => {
          await getSaucebox().invoke('save-state', { name, value });
        },
        removeItem: async (name) => {
          await getSaucebox().invoke('remove-state', name);
        }
      }))
    }
  )
);
