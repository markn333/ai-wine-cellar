import { create } from 'zustand';
import { ChatMessage, ChatContext } from '../types/chat';
import { Wine } from '../types/wine';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;

  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  generateContext: (wines: Wine[]) => ChatContext;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [] }),

  generateContext: (wines) => {
    const total_bottles = wines.reduce((sum, w) => sum + w.quantity, 0);
    const by_type = wines.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + w.quantity;
      return acc;
    }, {} as Record<string, number>);

    const recent_wines = wines
      .slice(0, 5)
      .map(w => `${w.name} (${w.producer}, ${w.vintage || 'NV'})`);

    return {
      total_wines: wines.length,
      total_bottles,
      by_type,
      recent_wines,
    };
  },
}));
