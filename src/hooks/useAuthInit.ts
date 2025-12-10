"use client"

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAuthInit() {
  const autoLogin = useAuthStore((s) => s.autoLogin);

  useEffect(() => {
    autoLogin(); // runs once on app load
  }, [autoLogin]);
}
