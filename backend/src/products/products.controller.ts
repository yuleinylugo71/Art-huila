import { Body, Controller, Get, Param, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  
  @Get()
  async findAll(
    @Query('q') query?: string,
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
  ) {
    const products = await this.productsService.findFiltered(query, featured === 'true', limit ? parseInt(limit) : undefined);
    return products.map(p => {
      const reviews = p.reviews || [];
      const reviewCount = reviews.length;
      const avgRating = reviewCount > 0
        ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        status: p.artisan.verification_status,
        artisan: {
          name: p.artisan.user.full_name,
          avatar_url: p.artisan.avatar_url,
          status: p.artisan.verification_status,
        },
        rating: avgRating,
        review_count: reviewCount,
        image_url: p.images?.[0]?.url || '',
      };
    });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('artesano')
  @Get('artisan/mis-productos')
  myProducts(@CurrentUser() user: any) {
    return this.productsService.findByArtisan(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('artesano')
  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.productsService.create(user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('artesano')
  @Post(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.productsService.update(id, user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('artesano')
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const uploaded: { url: string; publicId: string }[] = [];
    for (const file of files) {
      const result = await this.cloudinaryService.uploadImage(file, 'arthuila/products');
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }
    return this.productsService.addImages(id, user.id, uploaded);
  }
}
