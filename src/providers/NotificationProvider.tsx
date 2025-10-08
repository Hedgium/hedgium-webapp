// app/providers/NotificationProvider.tsx
"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuthStore();
  const { addNotification, fetchNotifications } = useNotificationStore();

  const wsRef = useRef<WebSocket | null>(null);
    const retryCountRef = useRef(0);


   const maxRetries = 5;

  useEffect(() => {
    if (!accessToken) return;

    const connectWebSocket = () => {
      if (wsRef.current) return; // already connected or connecting

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/notifications/?token=${accessToken}`;

      console.log("🔌 Trying to connect WebSocket... Attempt", retryCountRef.current + 1);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("✅ WebSocket connected");
        retryCountRef.current = 0; // reset retry count
        fetchNotifications(); // load initial notifications
      };

      wsRef.current.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        addNotification(newNotification);
      };

      wsRef.current.onclose = () => {
        console.log("❌ WebSocket closed");

        wsRef.current = null;

        // Try reconnect if retries left
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const retryDelay = Math.min(1000 * 2 ** retryCountRef.current, 10000); // exponential backoff up to 10s
          console.log(`🔁 Reconnecting in ${retryDelay / 1000}s...`);
          setTimeout(connectWebSocket, retryDelay);
        } else {
          console.error("🚫 Max retry attempts reached. WebSocket not reconnecting.");
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("⚠️ WebSocket error:", err);
        wsRef.current?.close();
      };
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      retryCountRef.current = 0;
    };
  }, [accessToken]);

  return <>{children}</>;
}
