import { Controller, Get, Param, Post, UseGuards, UploadedFiles, UseInterceptors, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ArtisansService } from './artisans.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('api/v1/artisans')
export class ArtisansController {
  constructor(
    private readonly artisansService: ArtisansService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    return this.artisansService.findByUserId(user.id);
  }

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.artisansService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/gallery')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadGallery(
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const profile = await this.artisansService.findByUserId(user.id);
    if (!profile) return { message: 'Profile not found' };
    const uploaded: string[] = [];
    for (const file of files) {
      const result = await this.cloudinaryService.uploadImage(file, 'arthuila/gallery');
      await this.artisansService.addGalleryImage(profile.id, result.secure_url, result.public_id);
      uploaded.push(result.secure_url);
    }
    return { uploaded };
