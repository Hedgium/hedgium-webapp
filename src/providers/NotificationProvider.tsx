// app/providers/NotificationProvider.tsx
"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuthStore();
  const { addNotification, fetchNotifications } = useNotificationStore();

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    

    if (!accessToken) return;
    if (wsRef.current) return;

    fetchNotifications(); // load initial notifications

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    wsRef.current = new WebSocket(
      `${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/notifications/?token=${accessToken}`
    );

    wsRef.current.onopen = () => console.log("🔌 WebSocket connected");
    wsRef.current.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      addNotification(newNotification);
    };
    wsRef.current.onclose = () => {
      console.log("❌ WebSocket closed");
      wsRef.current = null;
    };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [accessToken, fetchNotifications, addNotification]);

  return <>{children}</>;
}
