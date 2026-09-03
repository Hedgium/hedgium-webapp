export type BrokerProxyPoolAssignedProfile = {
  id: number;
  user_id: number;
  broker_name: string;
  broker_user_id?: string | null;
  first_name?: string;
  last_name?: string;
};

export const BROKER_PROXY_POOL_BROKERS = [
  "ZERODHA",
  "SHOONYA",
  "GROWW",
  "KOTAKNEO",
  "IIFLCAPITAL",
] as const;

export type BrokerProxyPoolBroker = (typeof BROKER_PROXY_POOL_BROKERS)[number];

export type BrokerProxyPool = {
  id: number;
  broker_name: BrokerProxyPoolBroker;
  ip_address: string;
  host: string;
  port: number;
  username: string | null;
  is_active: boolean;
  /** ISO date (YYYY-MM-DD) until which the proxy lease is valid; null if unset. */
  validity: string | null;
  assigned_profile: BrokerProxyPoolAssignedProfile | null;
  created_at: string;
  updated_at: string;
};
