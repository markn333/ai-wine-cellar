import { create } from 'zustand';

interface NetworkStore {
  isOnline: boolean;
  isConnected: boolean;
  setOnline: (online: boolean) => void;
  setConnected: (connected: boolean) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: true,
  isConnected: true,
  setOnline: (online) => set({ isOnline: online }),
  setConnected: (connected) => set({ isConnected: connected }),
}));
