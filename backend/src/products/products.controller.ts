import { Body, Controller, Get, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('api/v1/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
