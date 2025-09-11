import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  user: any | null;
  isLoading: boolean;
  isInitializing: boolean;

  login: (username: string, password: string) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  autoLogin: () => Promise<void>;
  startAutoRefresh: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: false,
  isInitializing: true,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "users/auth/login/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      }
    );

    if (!res.ok) {
      set({ isLoading: false });
      throw new Error("Login failed");
    }

    const data = await res.json();
    set({ accessToken: data.access_token, isLoading: false });

    // fetch user details separately
    await get().fetchUser();

    set({ isInitializing: false });
    get().startAutoRefresh();
  },

  refreshAccessToken: async () => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "users/token/refresh",
        {
          method: "POST",
          headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        set({ accessToken: data.access_token });

        // fetch user after refresh
        await get().fetchUser();

        return true;
      } else {
        set({ accessToken: null, user: null });
        return false;
      }
    } catch {
      set({ accessToken: null, user: null });
      return false;
    }
  },

  fetchUser: async () => {
    if (!get().accessToken) return;

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "users/auth/me",
        {
          headers: {
            "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ?? "",
            Authorization: `Bearer ${get().accessToken}`,
          },
          credentials: "include",
        }
      );

      if (res.ok) {
        const user = await res.json();
        console.log(user);
        set({ user });
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null });
    }
  },

  logout: async () => {
    console.log("Logout Called");
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "users/auth/logout",
      {
        method: "POST",
        headers: {
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ?? "",
          Authorization: get().accessToken ? `Bearer ${get().accessToken}` : "",
        },
        credentials: "include",
      }
    );

    const data = await res.json();
    console.log(data);

    set({ accessToken: null, user: null });
  },

  autoLogin: async () => {
    set({ isInitializing: true });
    const ok = await get().refreshAccessToken();
    if (ok) {
      get().startAutoRefresh();
    }
    set({ isInitializing: false });
  },

  startAutoRefresh: () => {
    const interval = 1000 * 60 * 1; // 1 miutes
    setTimeout(async function refreshLoop() {
      await get().refreshAccessToken();
      setTimeout(refreshLoop, interval);
    }, interval);
  },
}));
