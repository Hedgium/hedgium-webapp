// app/providers/NotificationProvider.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuthStore();
  const { addNotification, fetchNotifications } = useNotificationStore();

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  // const [tick, setTick] = useState<any | null>(null);
  // const wsRef1 = useRef<WebSocket | null>(null);

  // useEffect(() => {
  //   console.log("Connecting to tick websocket...");
  //   if (!accessToken) return;

  //   const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  //   const wsUrl = `${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/ticks/?token=${accessToken}&instrument_token=408065`;
  //   console.log("WebSocket URL:", wsUrl);
  //   const ws1 = new WebSocket(wsUrl);

  //   wsRef1.current = ws1 ;

  //   ws1.onopen = () => {
  //     console.log("Tick websocket connected");
  //   };

  //   ws1.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);
  //       console.log("Received tick data:", data);
  //       setTick(data);
  //     } catch (e) {
  //       console.log("Failed to parse tick", e);
  //     }
  //   };

  //   ws1.onerror = (e) => {
  //     console.log("Tick websocket error", e);
  //   };

  //   return () => {
  //     ws1.close();
  //   };
  // }, [accessToken]);


  useEffect(() => {
    if (!accessToken) return;

    // Load alerts via HTTP regardless of WebSocket — WS is only for live pushes.
    void fetchNotifications();

    const connectWebSocket = () => {
      if (wsRef.current) return; // already connected or connecting

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/notifications/?token=${accessToken}`;

      console.log("🔌 Trying to connect WebSocket... Attempt", retryCountRef.current + 1);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("✅ WebSocket connected");
        retryCountRef.current = 0; // reset retry count
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
          console.log("🚫 Max retry attempts reached. WebSocket not reconnecting.");
        }
      };

      wsRef.current.onerror = (err) => {
        console.log("⚠️ WebSocket error:", err);
        wsRef.current?.close();
      };
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      retryCountRef.current = 0;
    };
  }, [accessToken, fetchNotifications]);

  return <>{children}</>;
}
