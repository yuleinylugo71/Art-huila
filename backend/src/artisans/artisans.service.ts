import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ArtisanProfile,
  ArtisanStatus,
} from './entities/artisan-profile.entity';
import { ArtisanGallery } from './entities/artisan-gallery.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/constants';

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

  async updateStatus(
    id: string,
    status: ArtisanStatus,
    rejectionReason?: string,
  ) {
    const profile = await this.profileRepo.findOneBy({ id });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    profile.verification_status = status;
    if (rejectionReason) profile.rejection_reason = rejectionReason;
    return this.profileRepo.save(profile);
  }

  async updateProfile(userId: string, data: any) {
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'category', 'region'],
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    if (data.cultural_history !== undefined)
      profile.cultural_history = data.cultural_history;
    if (data.avatar_url !== undefined) profile.avatar_url = data.avatar_url;
    if (data.category_id !== undefined)
      profile.category = { id: data.category_id } as any;
    if (data.region_id !== undefined)
      profile.region = { id: data.region_id } as any;
    if (data.id_number !== undefined) profile.id_number = data.id_number;
    if (data.truthfulness_declaration !== undefined) {
      profile.truthfulness_declaration =
        data.truthfulness_declaration === true ||
        data.truthfulness_declaration === 'true';
    }
    if (data.id_document_front_url !== undefined)
      profile.id_document_front_url = data.id_document_front_url;
    if (data.id_document_back_url !== undefined)
      profile.id_document_back_url = data.id_document_back_url;

    if (data.full_name && profile.user) {
      profile.user.full_name = data.full_name;
      await this.profileRepo.manager.save(profile.user);
    }

    await this.profileRepo.save(profile);
    return this.findByUserId(userId);
  }

  async findFeatured() {
    return this.profileRepo.find({
      where: { verification_status: ArtisanStatus.VERIFIED },
      relations: ['user', 'region'],
      take: 3,
      order: { created_at: 'DESC' },
    });
  }

  async apply(
    userId: string,
    data: any,
    idDocumentFrontUrl: string | null,
    idDocumentBackUrl: string | null,
    galleryUrls: { url: string; public_id: string }[],
    clientIp: string,
  ) {
    let profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'gallery'],
    });

    if (profile) {
      if (
        profile.verification_status === ArtisanStatus.PENDING ||
        profile.verification_status === ArtisanStatus.VERIFIED ||
        profile.verification_status === ArtisanStatus.ACTIVE
      ) {
        throw new ConflictException(
          'Ya tienes una solicitud pendiente, activa o verificada.',
        );
      }
    }

    const existingArtisan = await this.profileRepo.findOne({
      where: { id_number: data.id_number },
    });
    if (existingArtisan && (!profile || existingArtisan.id !== profile.id)) {
      throw new ConflictException(
        'El número de cédula (ID) ya se encuentra registrado',
      );
    }

    const user = await this.profileRepo.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.role = UserRole.ARTISAN;
    await this.profileRepo.manager.save(user);

    if (!profile) {
      profile = this.profileRepo.create({
        user,
        id_number: data.id_number,
        cultural_history: data.cultural_history,
        category: { id: data.category_id },
        region: { id: data.region_id },
        verification_status: ArtisanStatus.PENDING,
        truthfulness_declaration:
          data.truthfulness_declaration === true ||
          data.truthfulness_declaration === 'true',
        legal_acceptance_ip: clientIp,
        legal_acceptance_timestamp: new Date(),
        id_document_front_url: idDocumentFrontUrl,
        id_document_back_url: idDocumentBackUrl,
      });
    } else {
      profile.id_number = data.id_number;
      profile.cultural_history = data.cultural_history;
      profile.category = { id: data.category_id } as any;
      profile.region = { id: data.region_id } as any;
      profile.verification_status = ArtisanStatus.PENDING;
      profile.truthfulness_declaration =
        data.truthfulness_declaration === true ||
        data.truthfulness_declaration === 'true';
      profile.legal_acceptance_ip = clientIp;
      profile.legal_acceptance_timestamp = new Date();
      if (idDocumentFrontUrl)
        profile.id_document_front_url = idDocumentFrontUrl;
      if (idDocumentBackUrl) profile.id_document_back_url = idDocumentBackUrl;
    }

    await this.profileRepo.save(profile);

    if (galleryUrls && galleryUrls.length > 0) {
      for (const item of galleryUrls) {
        const galleryItem = this.galleryRepo.create({
          url: item.url,
          public_id: item.public_id,
          profile,
        });
        await this.galleryRepo.save(galleryItem);
      }
    }

    return this.findByUserId(userId);
  }
}
