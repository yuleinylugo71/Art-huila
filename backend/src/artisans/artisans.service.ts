import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtisanProfile, ArtisanStatus } from './entities/artisan-profile.entity';
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
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'category', 'region', 'gallery'],
    });
    if (profile) (profile as any).status = profile.verification_status;
    return profile;
  }

  async findById(id: string): Promise<ArtisanProfile | null> {
    const profile = await this.profileRepo.findOne({
      where: { id },
      relations: ['user', 'category', 'region', 'gallery'],
    });
    if (profile) (profile as any).status = profile.verification_status;
    return profile;
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.verification_status = status as ArtisanStatus;
    const profiles = await this.profileRepo.find({
      where,
      relations: ['user', 'category', 'region'],
      order: { created_at: 'DESC' },
    });
    return profiles.map((profile) => {
      (profile as any).status = profile.verification_status;
      return profile;
    });
  }

  async addGalleryImage(profileId: string, url: string, publicId: string) {
    const profile = await this.profileRepo.findOneBy({ id: profileId });
    if (!profile) throw new NotFoundException('Artisan not found');
    const img = this.galleryRepo.create({ url, public_id: publicId, profile });
    return this.galleryRepo.save(img);
  }

  async updateStatus(id: string, status: ArtisanStatus, rejectionReason?: string) {
    const profile = await this.profileRepo.findOneBy({ id });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    profile.verification_status = status;
    if (rejectionReason) profile.rejection_reason = rejectionReason;
    return this.profileRepo.save(profile);
  }

  async updateProfile(userId: string, data: any) {
    const profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    if (data.cultural_history) profile.cultural_history = data.cultural_history;
    if (data.avatar_url) profile.avatar_url = data.avatar_url;
    if (data.category_id) profile.category = { id: data.category_id } as any;
    if (data.region_id) profile.region = { id: data.region_id } as any;

    return this.profileRepo.save(profile);
  }

  async findFeatured() {
    return this.profileRepo.find({
      where: { verification_status: ArtisanStatus.VERIFIED },
      relations: ['user', 'region'],
      take: 3,
      order: { created_at: 'DESC' },
    });
  }
}
