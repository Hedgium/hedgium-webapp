import { create } from "zustand";
import { authFetch } from "@/utils/api";



export interface Notification {
  id: number;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  related_model_name: "strategy" | "position" | "order";
  related_model_id: number;
}

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;

  fetchNotifications: () => Promise<void>;
  addNotification: (n: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: true,
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await authFetch("/notifications/", { method: "GET" });

      if (res.ok){
      const data: Notification[] = await res.json();
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.read).length,
        isLoading: false,
      });
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      set({ isLoading: false });
    }
  
  },

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.read ? 0 : 1),
    })),

  markAsRead: async (id) => {
    try {
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        };
      });
      
      await authFetch(`/notifications/${id}/read/`, { method: "POST" });
      
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  },

  markAllAsRead: async () => {
    try {

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));

      await authFetch("/notifications/mark-all-read/", { method: "POST" });
      
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  },

  deleteNotification: async (id) => {
    try {
      set((state) => {
        const updated = state.notifications.filter((n) => n.id !== id);
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        };
      });

      await authFetch(`/notifications/${id}/`, { method: "DELETE" });
      
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  },
}));
