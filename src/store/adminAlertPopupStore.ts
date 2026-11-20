import { create } from "zustand";

const STORAGE_KEY = "adminAlertPopups";

function readStoredEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw !== "false";
  } catch {
    return true;
  }
}

interface AdminAlertPopupState {
  enabled: boolean;
  hydrated: boolean;
  hydrate: () => void;
  setEnabled: (enabled: boolean) => void;
}

const useAdminAlertPopupStore = create<AdminAlertPopupState>((set) => ({
  enabled: true,
  hydrated: false,

  hydrate: () => {
    set({ enabled: readStoredEnabled(), hydrated: true });
  },

  setEnabled: (enabled) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Ignore quota / private-mode failures; keep in-memory preference.
    }
    set({ enabled });
  },
}));

export default useAdminAlertPopupStore;
