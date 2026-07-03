import type { User } from "@/store/authStore";

export function isDemoUser(user: User | null | undefined): boolean {
  return Boolean(user?.is_demo);
}
