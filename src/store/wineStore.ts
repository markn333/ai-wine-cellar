import { create } from 'zustand';
import { Wine, TastingNote, DrinkingRecord } from '../types/wine';

interface WineStore {
  wines: Wine[];
  selectedWine: Wine | null;
  tastingNotes: TastingNote[];
  drinkingRecords: DrinkingRecord[];
  
  // Actions
  setWines: (wines: Wine[]) => void;
  addWine: (wine: Wine) => void;
  updateWine: (id: string, wine: Partial<Wine>) => void;
  deleteWine: (id: string) => void;
  setSelectedWine: (wine: Wine | null) => void;
  
  addTastingNote: (note: TastingNote) => void;
  addDrinkingRecord: (record: DrinkingRecord) => void;
}

export const useWineStore = create<WineStore>((set) => ({
  wines: [],
  selectedWine: null,
  tastingNotes: [],
  drinkingRecords: [],
  
  setWines: (wines) => set({ wines }),
  
  addWine: (wine) => set((state) => ({
    wines: [...state.wines, wine],
  })),
  
  updateWine: (id, updatedWine) => set((state) => ({
    wines: state.wines.map((w) => w.id === id ? { ...w, ...updatedWine } : w),
  })),
  
  deleteWine: (id) => set((state) => ({
    wines: state.wines.filter((w) => w.id !== id),
  })),
  
  setSelectedWine: (wine) => set({ selectedWine: wine }),
  
  addTastingNote: (note) => set((state) => ({
    tastingNotes: [...state.tastingNotes, note],
  })),
  
  addDrinkingRecord: (record) => set((state) => ({
    drinkingRecords: [...state.drinkingRecords, record],
  })),
}));
