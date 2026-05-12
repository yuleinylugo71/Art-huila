import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtisanProfile } from './entities/artisan-profile.entity';
import { ArtisanGallery } from './entities/artisan-gallery.entity';
import { ArtisansService } from './artisans.service';
import { ArtisansController } from './artisans.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MailModule } from '../mail/mail.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtisanProfile, ArtisanGallery]),
    CloudinaryModule,
    MailModule,
    AuditModule,
  ],
  controllers: [ArtisansController],
  providers: [ArtisansService],
  exports: [ArtisansService],
})
export class ArtisansModule {}
