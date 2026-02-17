import { create } from 'zustand';
import { Cellar } from '../types/wine';

interface CellarStore {
  cellars: Cellar[];
  setCellars: (cellars: Cellar[]) => void;
  addCellar: (cellar: Cellar) => void;
  updateCellar: (id: string, cellar: Cellar) => void;
  deleteCellar: (id: string) => void;
}

export const useCellarStore = create<CellarStore>((set) => ({
  cellars: [],
  setCellars: (cellars) => set({ cellars }),
  addCellar: (cellar) => set((state) => ({ cellars: [cellar, ...state.cellars] })),
  updateCellar: (id, cellar) =>
    set((state) => ({
      cellars: state.cellars.map((c) => (c.id === id ? cellar : c)),
    })),
  deleteCellar: (id) =>
    set((state) => ({
      cellars: state.cellars.filter((c) => c.id !== id),
    })),
}));
