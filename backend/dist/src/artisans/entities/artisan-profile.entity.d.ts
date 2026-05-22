import { User } from '../../users/entities/user.entity';
import { Region } from '../../regions/entities/region.entity';
import { Category } from '../../categories/entities/category.entity';
import { ArtisanGallery } from './artisan-gallery.entity';
export declare enum ArtisanStatus {
    PENDING = "pending",
    ACTIVE = "active",
    VERIFIED = "verified",
    SUSPENDED = "suspended"
}
export { ArtisanStatus as VerificationStatus };
export declare class ArtisanProfile {
    id: string;
    user: User;
    id_number: string;
    cultural_history: string;
    category: Category;
    region: Region;
    verification_status: ArtisanStatus;
    rejection_reason: string;
    truthfulness_declaration: boolean;
    legal_acceptance_ip: string | null;
    legal_acceptance_timestamp: Date | null;
    avatar_url: string;
    id_document_front_url: string | null;
    id_document_back_url: string | null;
    gallery: ArtisanGallery[];
    created_at: Date;
    updated_at: Date;
}
