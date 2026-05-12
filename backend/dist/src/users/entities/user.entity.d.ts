export declare enum UserRole {
    ARTISAN = "artesano",
    BUYER = "comprador",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    full_name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    email_verified: boolean;
    email_verification_token: string;
    email_token_expires_at: Date | null;
    failed_login_attempts: number;
    locked_until: Date | null;
    created_at: Date;
    updated_at: Date;
}
