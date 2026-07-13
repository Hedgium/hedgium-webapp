import { create } from "zustand";
import { authFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import type { Notification } from "@/types/notifications";

export type { Notification } from "@/types/notifications";
export type NotificationDaysFilter = 1 | 7;

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;
  daysFilter: NotificationDaysFilter;

  fetchNotifications: (days?: NotificationDaysFilter) => Promise<void>;
  setDaysFilter: (days: NotificationDaysFilter) => Promise<void>;
  addNotification: (n: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

function notificationWithinDays(
  notification: Notification,
  days: NotificationDaysFilter
): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(notification.timestamp).getTime() >= cutoff;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: true,
  unreadCount: 0,
  daysFilter: 1,

  fetchNotifications: async (days) => {
    const resolvedDays = days ?? get().daysFilter;
    set({ isLoading: true, daysFilter: resolvedDays });

    try {
      const res = await authFetch(`/notifications/?days=${resolvedDays}`, {
        method: "GET",
      });

      if (res.ok) {
        const data: Notification[] = await res.json();
        set({
          notifications: data,
          unreadCount: data.filter((n) => !n.read).length,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      set({ isLoading: false });
    }
  },

  setDaysFilter: async (days) => {
    if (get().daysFilter === days && get().notifications.length > 0) {
      return;
    }
    await get().fetchNotifications(days);
  },

  addNotification: (n) =>
    set((state) => {
      const normalized: Notification = {
        ...n,
        source: n.source ?? "client",
      };
      if (state.notifications.some((existing) => existing.id === normalized.id)) {
        return state;
      }
      if (!notificationWithinDays(normalized, state.daysFilter)) {
        return state;
      }
      return {
        notifications: [normalized, ...state.notifications],
        unreadCount: state.unreadCount + (normalized.read ? 0 : 1),
      };
    }),

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

      if (!useAuthStore.getState().user?.is_demo) {
        await authFetch(`/notifications/${id}/read/`, { method: "POST" });
      }
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

      if (!useAuthStore.getState().user?.is_demo) {
        await authFetch(`/notifications/${id}/`, { method: "DELETE" });
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  },
}));
