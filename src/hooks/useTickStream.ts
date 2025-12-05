import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export function useTickStream(
  initialTokens: { token: number; mode?: string }[] = []
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const { accessToken } = useAuthStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ticks, setTicks] = useState<Record<number, any>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let shouldReconnect = true;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";

      // Build URL with multiple tokens + mode
      const queryParams = initialTokens
        .map((t) => `instrument_token=${t.token}&mode=${t.mode || "LTP"}`)
        .join("&");

      const wsUrl = `${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/ticks/?token=${accessToken}&${queryParams}`;

      console.log("🔌 Connecting to tick stream...");

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🟢 Tick websocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTicks((prev) => ({
            ...prev,
            [data.instrument_token]: data,
          }));
        } catch (e) {
          console.error("Tick parse error", e);
        }
      };

      ws.onerror = (err) => {
        console.log("🔴 Tick WS error:", err);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("🔴 Tick websocket closed");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (shouldReconnect) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;
          console.log(`🔄 Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [accessToken]);

  // --- Dynamic subscribe (supports mode) ---
  const subscribeToken = (token: number, mode: string = "LTP") => {
    wsRef.current?.send(
      JSON.stringify({
        action: "subscribe",
        token,
        mode: mode.toUpperCase(),
      })
    );
  };

  // --- Dynamic unsubscribe ---
  const unsubscribeToken = (token: number) => {
    wsRef.current?.send(
      JSON.stringify({
        action: "unsubscribe",
        token,
      })
    );
  };

  return {
    ticks,
    isConnected,
    subscribeToken,
    unsubscribeToken,
  };
}
