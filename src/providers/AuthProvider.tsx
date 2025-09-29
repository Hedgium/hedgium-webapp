"use client";

import { ReactNode } from "react";
import { useAuthInit } from "@/hooks/useAuthInit";

export default function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit(); // autoLogin runs on mount
  return <>{children}</>;
}
