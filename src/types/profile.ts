export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

export interface Profile {
    id: number;
    user_id: number;
    broker_name: string;
    broker_user_id: string;
    margin_equity: number;
    verified: boolean;
    is_active: boolean;
    kite_login_device: string;
    created_at: string;
    updated_at: string;
    user: User;
    broker_logged_in: boolean;
}

export interface ProfileResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Profile[];
}
