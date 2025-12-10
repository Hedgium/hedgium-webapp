import { create } from "zustand";
// import useAlert from "@/hooks/useAlert";
import { generateKeyPair } from "@/utils/crypto";

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  max_strategies: number;
  created_at: string; // ISO date string
}

export interface Keys {
  public_key: string,
  encrypted_private_key: string, 
  iv: string
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan: SubscriptionPlan;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
  is_active: boolean;
}

export interface User {
  id: number;
  first_name: string | null,
  last_name: string | null,
  username: string;
  email: string;
  mobile: string | null;
  verified: boolean;
  signup_step: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  kyc_skipped: boolean;
  active_subscription: UserSubscription | null;
  broker_logged_in: boolean | false;
  is_staff: boolean | false;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  refreshTimerId: NodeJS.Timeout | null;
  keys: Keys | null;

  login: (username: string, password: string) => Promise<void>;
  loginWithToken: (token:string) => Promise<void>;
  userKeyGet: () => Promise<Keys|null>;
  userKeyCreateUpdate: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  autoLogin: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  updateUser: (partial: Partial<User>) => void; // 👈 new

}

export const useAuthStore = create<AuthState>((set, get) => ({

  accessToken: null,
  user: null,
  isLoading: false,
  isInitializing: true,
  refreshTimerId: null,
  keys: null,


  userKeyGet: async () => {
    const res = await fetch("/api/proxy/users/userkey/", {
      headers: { Authorization: `Bearer ${get().accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      console.log(data);
      set({keys:data})
      // console.log("Existing user key:", data);
      return data;
    }
    return null;
  },

  loginWithToken: async (token: string) => {
  
    try {
      const res = await fetch("/api/proxy/users/token/exchange-token/?token="+token, 
        {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        set({ accessToken: data.access_token });
      } else {
      }
    } catch {
      set({ user: null });
    }

  },

  userKeyCreateUpdate: async ()=> {
    // console.log("create update ")
    const { publicKey, privateKey } = await generateKeyPair();
    // console.log(publicKey, privateKey);
    

    try {
      const res = await fetch("/api/proxy/users/userkey/", {
        method: "POST",
        body: JSON.stringify({
          public_key: publicKey,
        }),

        headers: { Authorization: `Bearer ${get().accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        // console.log(data)
        set({keys:data})

      } else {
      }
    } catch (e){
      console.log(e);
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });
    const res = await fetch("/api/proxy/users/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!res.ok) {
      set({ isLoading: false });
      const data =  await res.json();
      throw data;
    }

    const data = await res.json();
    set({ accessToken: data.access_token, isLoading: false });
    set({ isInitializing: false });

    get().fetchUser();

    const keys = await get().userKeyGet();
    if (!keys) {
      get().userKeyCreateUpdate();
    }
    get().startAutoRefresh();
  },

  refreshAccessToken: async () => {
    try {
      const res = await fetch("/api/proxy/users/token/refresh/", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        set({ accessToken: data.access_token });
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
      const res = await fetch("/api/proxy/users/auth/me/", {
        headers: { Authorization: `Bearer ${get().accessToken}` },
        credentials: "include",
      });

      if (res.ok) {
        const user: User = await res.json();
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
    get().stopAutoRefresh();
    const accessT =  get().accessToken
    set({ accessToken: null, user: null });

    await fetch("/api/proxy/users/auth/logout/", {
      method: "POST",
      headers: {
        Authorization: accessT ? `Bearer ${accessT}` : "",
      },
      credentials: "include",
    }).catch(() => {});
    // stop auto refresh loop
  },

  autoLogin: async () => {
    set({ isInitializing: true });
    const ok = await get().refreshAccessToken();
    set({ isInitializing: false });
    await get().fetchUser();

    const keys = await get().userKeyGet();
    if (!keys) {
      get().userKeyCreateUpdate();
    }
    
    if (ok) get().startAutoRefresh();
    
  },

  startAutoRefresh: () => {
    get().stopAutoRefresh(); // clear any old one first
    const interval = 1000 * 60 * 29; // 29 minute
    const id = setInterval(async () => {
      await get().refreshAccessToken();
    }, interval);
    set({ refreshTimerId: id });
  },

  stopAutoRefresh: () => {
    const id = get().refreshTimerId;
    if (id) clearInterval(id);
    set({ refreshTimerId: null });
  },

  updateUser: (partial) => {
    // console.log(partial);
    const user = get().user;
    if (!user) return; // ignore if user not loaded
    set({ user: { ...user, ...partial } });
  },
}));
