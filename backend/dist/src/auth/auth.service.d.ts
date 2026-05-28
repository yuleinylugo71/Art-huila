import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto, RegisterArtisanDto } from './dto/auth.dto';
import { Repository } from 'typeorm';
import { ArtisanProfile } from '../artisans/entities/artisan-profile.entity';
import { Category } from '../categories/entities/category.entity';
import { Region } from '../regions/entities/region.entity';
import { RefreshToken } from './entities/refresh-token.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly mailService;
    private readonly artisanRepo;
    private readonly categoryRepo;
    private readonly regionRepo;
    private readonly refreshTokenRepo;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, mailService: MailService, artisanRepo: Repository<ArtisanProfile>, categoryRepo: Repository<Category>, regionRepo: Repository<Region>, refreshTokenRepo: Repository<RefreshToken>);
    private uploadToCloudinary;
    private generateTokens;
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
    registerArtisan(dto: RegisterArtisanDto, idDocumentFrontFile?: Express.Multer.File, idDocumentBackFile?: Express.Multer.File, galleryFiles?: Express.Multer.File[], clientIp?: string): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
}
