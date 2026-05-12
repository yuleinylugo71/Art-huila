import { User } from '../../users/entities/user.entity';
import { Region } from '../../regions/entities/region.entity';
import { Category } from '../../categories/entities/category.entity';
import { ArtisanGallery } from './artisan-gallery.entity';
export declare enum VerificationStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    REJECTED = "rejected",
    SUSPENDED = "suspended"
}
export declare class ArtisanProfile {
    id: string;
    user: User;
    id_number: string;
    cultural_history: string;
    category: Category;
    region: Region;
    verification_status: VerificationStatus;
    rejection_reason: string;
    truthfulness_declaration: boolean;
    avatar_url: string;
    gallery: ArtisanGallery[];
    created_at: Date;
    updated_at: Date;
}
