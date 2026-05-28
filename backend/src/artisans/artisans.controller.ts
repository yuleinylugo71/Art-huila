import { Controller, Get, Param, Post, UseGuards, UploadedFiles, UseInterceptors, Body, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ArtisansService } from './artisans.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('artisans')
export class ArtisansController {
  constructor(
    private readonly artisansService: ArtisansService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  
  @Get()
  async findAll(@Query('featured') featured?: string) {
    if (featured === 'true') {
      const artisans = await this.artisansService.findFeatured();
      return artisans.map(a => ({
        name: a.user.full_name,
        city: a.region?.name || 'Huila',
        bio: a.cultural_history.substring(0, 120) + '...',
        avatar_url: a.avatar_url,
        verified: a.verification_status === 'verified',
        status: a.verification_status,
      }));
    }
    return this.artisansService.findAll();
  }

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
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.artisansService.updateProfile(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FilesInterceptor('image', 1))
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) return { message: 'No image provided' };
    const result = await this.cloudinaryService.uploadImage(files[0], 'arthuila/avatars');
    await this.artisansService.updateProfile(user.id, { avatar_url: result.secure_url });
    return { avatar_url: result.secure_url };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/document-front')
  @UseInterceptors(FilesInterceptor('document', 1))
  async uploadDocumentFront(
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) return { message: 'No file provided' };
    const result = await this.cloudinaryService.uploadImage(files[0], 'arthuila/documents');
    await this.artisansService.updateProfile(user.id, { id_document_front_url: result.secure_url });
    return { id_document_front_url: result.secure_url };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/document-back')
  @UseInterceptors(FilesInterceptor('document', 1))
  async uploadDocumentBack(
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) return { message: 'No file provided' };
    const result = await this.cloudinaryService.uploadImage(files[0], 'arthuila/documents');
    await this.artisansService.updateProfile(user.id, { id_document_back_url: result.secure_url });
    return { id_document_back_url: result.secure_url };
  }
}
