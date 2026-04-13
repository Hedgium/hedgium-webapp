export type BrokerProxyPoolAssignedProfile = {
  id: number;
  user_id: number;
  broker_name: string;
  broker_user_id?: string | null;
  first_name?: string;
  last_name?: string;
};

export type BrokerProxyPool = {
  id: number;
  ip_address: string;
  host: string;
  port: number;
  username: string | null;
  is_active: boolean;
  assigned_profile: BrokerProxyPoolAssignedProfile | null;
  created_at: string;
  updated_at: string;
};
