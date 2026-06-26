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
        status: import("./entities/artisan-profile.entity").ArtisanStatus;
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
    updateProfile(user: any, body: any): Promise<import("./entities/artisan-profile.entity").ArtisanProfile | null>;
    uploadAvatar(user: any, files: Express.Multer.File[]): Promise<{
        message: string;
        avatar_url?: undefined;
    } | {
        avatar_url: string;
        message?: undefined;
    }>;
    uploadDocumentFront(user: any, files: Express.Multer.File[]): Promise<{
        message: string;
        id_document_front_url?: undefined;
    } | {
        id_document_front_url: string;
        message?: undefined;
    }>;
    uploadDocumentBack(user: any, files: Express.Multer.File[]): Promise<{
        message: string;
        id_document_back_url?: undefined;
    } | {
        id_document_back_url: string;
        message?: undefined;
    }>;
    apply(user: any, files: {
        id_document_front?: Express.Multer.File[];
        id_document_back?: Express.Multer.File[];
        gallery?: Express.Multer.File[];
    }, body: any, req: any): Promise<import("./entities/artisan-profile.entity").ArtisanProfile | null>;
}
