export declare class RegisterDto {
    full_name: string;
    email: string;
    password: string;
    role: 'artesano' | 'comprador';
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshDto {
    refresh_token: string;
}
export declare class LogoutDto extends RefreshDto {
}
export declare class RegisterArtisanDto extends RegisterDto {
    id_number: string;
    cultural_history: string;
    category_id: string;
    region_id: string;
    truthfulness_declaration: string;
}
