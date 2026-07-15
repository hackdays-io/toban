import { create } from "zustand";
import { persist } from "zustand/middleware";

const RECENT_LIMIT = 5;

type WorkspaceState = {
  currentWorkspaceId: string | null;
  recent: string[];
  switch: (workspaceId: string) => void;
  clear: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      recent: [],
      switch: (workspaceId) =>
        set((state) => ({
          currentWorkspaceId: workspaceId,
          recent: [
            workspaceId,
            ...state.recent.filter((id) => id !== workspaceId),
          ].slice(0, RECENT_LIMIT),
        })),
      clear: () => set({ currentWorkspaceId: null, recent: [] }),
    }),
    { name: "toban:workspace" },
  ),
);
