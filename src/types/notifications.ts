export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type NotificationSource = "client" | "telegram" | "telegram:leads";

export type RelatedModelName =
  | "strategies"
  | "trade_cycles"
  | "orders"
  | "profiles"
  | "leads"
  | "positions"
  | "builders"
  | "system";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source: NotificationSource;
  related_model_name: RelatedModelName | string | null;
  related_model_id: number | null;
}

export interface PaginatedNotifications {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export const SOURCE_LABELS: Record<NotificationSource, string> = {
  client: "Client",
  telegram: "Telegram",
  "telegram:leads": "Telegram Leads",
};

export const ENTITY_LABELS: Record<string, string> = {
  strategies: "Strategy",
  trade_cycles: "Trade Cycle",
  orders: "Orders",
  profiles: "Account",
  leads: "Leads",
  positions: "Positions",
  builders: "Builder",
  system: "System",
};
