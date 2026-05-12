import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto, RegisterArtisanDto } from './dto/auth.dto';
import { UserRole } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { ArtisanProfile } from '../artisans/entities/artisan-profile.entity';
import { Category } from '../categories/entities/category.entity';
import { Region } from '../regions/entities/region.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly mailService;
    private readonly artisanRepo;
    private readonly categoryRepo;
    private readonly regionRepo;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, mailService: MailService, artisanRepo: Repository<ArtisanProfile>, categoryRepo: Repository<Category>, regionRepo: Repository<Region>);
    private generateTokens;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            full_name: string;
            role: UserRole;
        };
        access_token: string;
        refresh_token: string;
    }>;
    registerBuyer(dto: RegisterDto): Promise<{
        message: string;
    }>;
    registerArtisan(dto: RegisterArtisanDto): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
}
