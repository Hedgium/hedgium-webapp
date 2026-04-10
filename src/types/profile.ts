export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    mobile?: string | null;
    signup_step?: string | null;
    verified?: boolean | null;
    last_login?: string | null;
    aadhar_number?: string | null;
    pan_number?: string | null;
    pan_document_url?: string | null;
    aadhar_document_url?: string | null;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    description: string | null;
    price: number;
    max_strategies: number;
}

export interface UserSubscription {
    id: number;
    plan: SubscriptionPlan;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_valid: boolean;
}

export interface Profile {
    id: number;
    user_id: number;
    broker_name: string;
    broker_user_id: string;
    margin_equity: number;
    /** ISO datetime when margin_equity last changed (broker refresh, admin, bulk task). */
    margin_updated_at?: string | null;
    order_value_factor: number;
    quantity_multiplier: number;
    verified: boolean;
    is_active: boolean;
    kite_login_device: string;
    auto_trade_allowed?: boolean;
    created_at: string;
    updated_at: string;
    user: User;
    broker_logged_in: boolean;
    subscription?: UserSubscription | null;
    /** Static-IP proxy for order create/modify/cancel (admin). Empty host = off. */
    proxy_host?: string | null;
    proxy_port?: number | null;
    proxy_username?: string | null;
    /** Assigned broker proxy pool row (staff list/detail). */
    broker_proxy_pool?: {
        id: number;
        ip_address: string;
        host: string;
        port: number;
        username?: string | null;
    } | null;
}

export interface ProfileResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Profile[];
}
