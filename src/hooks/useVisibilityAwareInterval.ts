import { useEffect, useRef } from "react";

type Options = {
  /** When false, polling is disabled. Default true. */
  enabled?: boolean;
  /** Run once when polling starts (tab visible). Default false — avoids duplicate mount fetches. */
  runImmediately?: boolean;
  /** Run once when the tab becomes visible again. Default true. */
  refreshOnVisible?: boolean;
};

/**
 * setInterval that pauses while the document is hidden to cut background API/proxy traffic.
 */
export function useVisibilityAwareInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: Options = {}
) {
  const {
    enabled = true,
    runImmediately = false,
    refreshOnVisible = true,
  } = options;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const run = () => {
      void callbackRef.current();
    };

    const startInterval = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(run, intervalMs);
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopInterval();
        return;
      }
      if (refreshOnVisible) run();
      startInterval();
    };

    if (document.visibilityState === "visible") {
      if (runImmediately) run();
      startInterval();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, intervalMs, runImmediately, refreshOnVisible]);
}
