import { ArtisansService } from './artisans.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class ArtisansController {
    private readonly artisansService;
    private readonly cloudinaryService;
    constructor(artisansService: ArtisansService, cloudinaryService: CloudinaryService);
    findAll(featured?: string): Promise<import("./entities/artisan-profile.entity").ArtisanProfile[] | {
        name: string;
        city: string;
        bio: string;
        avatar_url: string;
        verified: boolean;
    }[]>;
    getMyProfile(user: any): Promise<import("./entities/artisan-profile.entity").ArtisanProfile | null>;
    getProfile(id: string): Promise<import("./entities/artisan-profile.entity").ArtisanProfile | null>;
    uploadGallery(user: any, files: Express.Multer.File[]): Promise<{
        message: string;
        uploaded?: undefined;
    } | {
        uploaded: string[];
        message?: undefined;
    }>;
    updateProfile(user: any, body: any): Promise<import("./entities/artisan-profile.entity").ArtisanProfile>;
    uploadAvatar(user: any, files: Express.Multer.File[]): Promise<{
        message: string;
        avatar_url?: undefined;
    } | {
        avatar_url: string;
        message?: undefined;
    }>;
}
