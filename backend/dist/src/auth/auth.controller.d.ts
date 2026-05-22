import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshDto, RegisterArtisanDto, RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            full_name: string;
            role: import("../users/entities/user.entity").Role;
        };
        access_token: string;
        refresh_token: string;
    }>;
    registerBuyer(dto: RegisterDto): Promise<{
        message: string;
    }>;
    registerArtisan(dto: RegisterArtisanDto, files: {
        id_document_front?: Express.Multer.File[];
        id_document_back?: Express.Multer.File[];
        gallery?: Express.Multer.File[];
    }, req: any): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(dto: LogoutDto): Promise<{
        message: string;
    }>;
    me(user: any): any;
}
