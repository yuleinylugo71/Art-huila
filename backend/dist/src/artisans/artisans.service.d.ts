import { Repository } from 'typeorm';
import { ArtisanProfile, VerificationStatus } from './entities/artisan-profile.entity';
import { ArtisanGallery } from './entities/artisan-gallery.entity';
export declare class ArtisansService {
    private readonly profileRepo;
    private readonly galleryRepo;
    constructor(profileRepo: Repository<ArtisanProfile>, galleryRepo: Repository<ArtisanGallery>);
    findByUserId(userId: string): Promise<ArtisanProfile | null>;
    findById(id: string): Promise<ArtisanProfile | null>;
    findAll(status?: string): Promise<ArtisanProfile[]>;
    addGalleryImage(profileId: string, url: string, publicId: string): Promise<ArtisanGallery>;
    updateStatus(id: string, status: VerificationStatus, rejectionReason?: string): Promise<ArtisanProfile>;
}
