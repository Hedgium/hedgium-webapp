import { create } from "zustand";
import { myFetch } from "@/utils/api";

interface AuthState {
  accessToken: string | null;
  user: any | null;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  logout: () => Promise<void>;
  autoLogin: () => Promise<void>;
  startAutoRefresh: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: false,

  login: async (username: String, password: String) => {
    set({ isLoading: true });
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "users/auth/login/" , {
      method: "POST",
      headers: { "Content-Type": "application/json",
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY ?? ""
       },
      body: JSON.stringify({ username, password }),
      credentials: "include", // important for cookies
    });

    if (!res.ok) {
      set({ isLoading: false });
      throw new Error("Login failed");
    }

    const data = await res.json();
    set({ accessToken: data.access_token, user:data.user, isLoading: false });
    get().startAutoRefresh();
  },

  refreshAccessToken: async () => {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL+ "users/token/refresh", {
      method: "POST",
      headers: { 
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY ?? ""
       },
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      set({ accessToken: data.access });
    } else {
      set({ accessToken: null, user: null });
    }
  },

  logout: async () => {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    });
    set({ accessToken: null, user: null });
  },

  autoLogin: async () => {
    // Try refreshing immediately on app load
    await get().refreshAccessToken();
    if (get().accessToken) {
      get().startAutoRefresh();
    }
  },

  startAutoRefresh: () => {
    // refresh every 4 minutes (before 5min expiry)
    const interval = 1000 * 60 * 4;
    setTimeout(async function refreshLoop() {
      await get().refreshAccessToken();
      setTimeout(refreshLoop, interval);
    }, interval);
  },
}));
