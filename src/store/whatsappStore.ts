import { create } from "zustand";
import { authFetch } from "@/utils/api";

type ConversationUnread = {
  unread_count: number;
};

type Paginated<T> = {
  results: T[];
};

interface WhatsAppState {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
}

export const useWhatsAppStore = create<WhatsAppState>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const res = await authFetch(
        "myadmin/whatsapp/conversations/?page_size=100"
      );
      if (!res.ok) return;

      const data: Paginated<ConversationUnread> = await res.json();
      const total = (data.results || []).reduce(
        (sum, conversation) => sum + (conversation.unread_count || 0),
        0
      );
      set({ unreadCount: total });
    } catch (err) {
      console.error("Failed to fetch WhatsApp unread count", err);
    }
  },
}));
