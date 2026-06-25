"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { hasAssignedTradeCycles } from "@/services/tradeCycles";

export function useHasAssignedTradeCycles() {
  const user = useAuthStore((s) => s.user);
  const [hasAssigned, setHasAssigned] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasAssigned(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    hasAssignedTradeCycles()
      .then((assigned) => {
        if (!cancelled) {
          setHasAssigned(assigned);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasAssigned(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { hasAssigned, loading };
}
