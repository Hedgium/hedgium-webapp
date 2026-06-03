/** Matches ``users.models.User.UserRole`` values from the backend. */
export const USER_ROLE_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "client", label: "Client" },
  // { value: "staff", label: "Staff" },
  // { value: "rm", label: "Relationship manager" },
  // { value: "demo", label: "Demo" },
  { value: "internal", label: "Internal" },
] as const;

export type UserRoleValue = (typeof USER_ROLE_FILTER_OPTIONS)[number]["value"];

export function userRoleLabel(role: string | null | undefined): string {
  const found = USER_ROLE_FILTER_OPTIONS.find((o) => o.value === role);
  return found?.label ?? role ?? "—";
}
