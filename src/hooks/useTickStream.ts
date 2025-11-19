import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export function useTickStream(
  initialTokens: { token: number; mode?: string }[] = []
) {
  const wsRef = useRef<WebSocket | null>(null);
  const { accessToken } = useAuthStore();
  const [ticks, setTicks] = useState<Record<number, any>>({});

  useEffect(() => {
    if (!accessToken) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    // Build URL with multiple tokens + mode
    const queryParams = initialTokens
      .map((t) => `instrument_token=${t.token}&mode=${t.mode || "LTP"}`)
      .join("&");

    const wsUrl = `${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/ticks/?token=${accessToken}&${queryParams}`;

    console.log("WS URL:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🟢 Tick websocket connected");
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

    ws.onerror = (err) => console.log("Tick WS error:", err);

    return () => ws.close();
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
    subscribeToken,
    unsubscribeToken,
  };
}
