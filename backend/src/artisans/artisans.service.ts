import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtisanProfile, VerificationStatus } from './entities/artisan-profile.entity';
import { ArtisanGallery } from './entities/artisan-gallery.entity';

@Injectable()
export class ArtisansService {
  constructor(
    @InjectRepository(ArtisanProfile)
    private readonly profileRepo: Repository<ArtisanProfile>,
    @InjectRepository(ArtisanGallery)
    private readonly galleryRepo: Repository<ArtisanGallery>,
  ) {}

  async findByUserId(userId: string): Promise<ArtisanProfile | null> {
    return this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'category', 'region', 'gallery'],
    });
  }

  async findById(id: string): Promise<ArtisanProfile | null> {
    return this.profileRepo.findOne({
      where: { id },
      relations: ['user', 'category', 'region', 'gallery'],
    });
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.verification_status = status as VerificationStatus;
    return this.profileRepo.find({
      where,
      relations: ['user', 'category', 'region'],
      order: { created_at: 'DESC' },
    });
  }

  async addGalleryImage(profileId: string, url: string, publicId: string) {
    const profile = await this.profileRepo.findOneBy({ id: profileId });
    if (!profile) throw new NotFoundException('Artisan not found');
    const img = this.galleryRepo.create({ url, public_id: publicId, profile });
    return this.galleryRepo.save(img);
  }

  async updateStatus(id: string, status: VerificationStatus, rejectionReason?: string) {
    const profile = await this.profileRepo.findOneBy({ id });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    profile.verification_status = status;
    if (rejectionReason) profile.rejection_reason = rejectionReason;
    return this.profileRepo.save(profile);
  }

 