import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "system";

type UIState = {
  sheetOpen: boolean;
  modalOpen: boolean;
  theme: Theme;
  setSheetOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sheetOpen: false,
      modalOpen: false,
      theme: "light",
      setSheetOpen: (open) => set({ sheetOpen: open }),
      setModalOpen: (open) => set({ modalOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "toban:ui",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
