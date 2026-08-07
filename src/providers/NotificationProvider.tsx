// app/providers/NotificationProvider.tsx
"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import useAlertStore from "@/store/alertStore";
import { isDemoUser } from "@/lib/demo";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuthStore();
  const { addNotification, fetchNotifications } = useNotificationStore();

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  /** True after the first HTTP notifications fetch for this login; reset on logout. */
  const hasFetchedNotificationsRef = useRef(false);
  const maxRetries = 5;

  // Reset fetch-once gate when the user logs out.
  useEffect(() => {
    if (!accessToken) {
      hasFetchedNotificationsRef.current = false;
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    mountedRef.current = true;

    // Load alerts once per authenticated session — not on every JWT rotation.
    if (!hasFetchedNotificationsRef.current) {
      hasFetchedNotificationsRef.current = true;
      void fetchNotifications();
    }

    if (isDemoUser(user)) {
      return () => {
        mountedRef.current = false;
      };
    }

    const connectWebSocket = () => {
      if (!mountedRef.current) return;
      if (wsRef.current) return;

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/notifications/?token=${accessToken}`;

      console.log("🔌 Trying to connect WebSocket... Attempt", retryCountRef.current + 1);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("✅ WebSocket connected");
        retryCountRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        const { notifications } = useNotificationStore.getState();
        const isDuplicate = notifications.some((n) => n.id === newNotification?.id);
        addNotification(newNotification);

        if (isDuplicate || newNotification?.read) return;

        const type = newNotification?.type as
          | "INFO"
          | "SUCCESS"
          | "WARNING"
          | "ERROR"
          | undefined;

        const message = newNotification?.message || "";
        const title = newNotification?.title || "Alert";
        const preview = message.length > 120 ? `${message.slice(0, 120)}…` : message;
        const text = `${title}: ${preview}`;

        const alertType =
          type === "SUCCESS" ? "success"
          : type === "WARNING" ? "warning"
          : type === "ERROR" ? "error"
          : "info";

        const duration =
          type === "ERROR" ? 8000 : type === "WARNING" ? 7000 : 6000;

        useAlertStore.getState().addAlert({ type: alertType, message: text, duration });
      };

      wsRef.current.onclose = () => {
        console.log("❌ WebSocket closed");

        wsRef.current = null;

        if (!mountedRef.current) return;

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const retryDelay = Math.min(1000 * 2 ** retryCountRef.current, 10000);
          console.log(`🔁 Reconnecting in ${retryDelay / 1000}s...`);
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connectWebSocket();
          }, retryDelay);
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
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      retryCountRef.current = 0;
    };
    // fetchNotifications and addNotification are stable Zustand actions — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.is_demo]);

  return <>{children}</>;
}
