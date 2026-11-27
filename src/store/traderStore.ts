import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TraderUiState {
  defaultProfileId: number | null;
  navCollapsed: boolean;
  setDefaultProfileId: (id: number | null) => void;
  setNavCollapsed: (collapsed: boolean) => void;
  toggleNavCollapsed: () => void;
}

export const useTraderStore = create<TraderUiState>()(
  persist(
    (set) => ({
      defaultProfileId: null,
      navCollapsed: false,
      setDefaultProfileId: (id) => set({ defaultProfileId: id }),
      setNavCollapsed: (collapsed) => set({ navCollapsed: collapsed }),
      toggleNavCollapsed: () =>
        set((state) => ({ navCollapsed: !state.navCollapsed })),
    }),
    { name: "hedgium-trader-terminal" }
  )
);
