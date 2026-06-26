export declare enum Role {
    ADMIN = "admin",
    ARTESANO = "artesano",
    COMPRADOR = "comprador"
}
export declare const UserRole: {
    readonly ADMIN: Role.ADMIN;
    readonly ARTISAN: Role.ARTESANO;
    readonly BUYER: Role.COMPRADOR;
};
export type UserRole = Role;
export declare class User {
    id: string;
    full_name: string;
    email: string;
    password_hash: string;
    role: Role;
    email_verified: boolean;
    verifiedAt: Date | null;
    email_verification_token: string;
    email_token_expires_at: Date | null;
    failed_login_attempts: number;
    locked_until: Date | null;
    reset_password_token: string;
    reset_password_expires: Date;
    address: string;
    city: string;
    phone: string;
    department: string;
    created_at: Date;
    updated_at: Date;
}
