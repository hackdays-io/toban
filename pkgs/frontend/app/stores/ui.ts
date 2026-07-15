import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "system";
export type Language = "ja" | "en";

type UIState = {
  sheetOpen: boolean;
  modalOpen: boolean;
  theme: Theme;
  language: Language;
  setSheetOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sheetOpen: false,
      modalOpen: false,
      theme: "light",
      language: "ja",
      setSheetOpen: (open) => set({ sheetOpen: open }),
      setModalOpen: (open) => set({ modalOpen: open }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "toban:ui",
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    },
  ),
);
