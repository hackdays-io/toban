import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionIdentity = {
  address: string;
  name?: string;
  domain?: string;
  ensName?: string;
  avatarUrl?: string;
  smartWalletAddress?: string;
};

type SessionState = {
  identity: SessionIdentity | null;
  setIdentity: (identity: SessionIdentity | null) => void;
  patchIdentity: (patch: Partial<SessionIdentity>) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      identity: null,
      setIdentity: (identity) => set({ identity }),
      patchIdentity: (patch) =>
        set((state) =>
          state.identity
            ? { identity: { ...state.identity, ...patch } }
            : { identity: null },
        ),
      clear: () => set({ identity: null }),
    }),
    { name: "toban:session" },
  ),
);
