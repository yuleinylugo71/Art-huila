import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products/products.service';
import { ArtisansService } from './artisans/artisans.service';

@Controller('stats')
export class StatsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly artisansService: ArtisansService,
  ) {}

  @Get()
  async getStats() {
    const productsCount = await this.productsService.getCount();
    const artisans = await this.artisansService.findAll('verified');

    return {
      artisans_count: artisans.length,
      products_count: productsCount,
      avg_rating: 4.8,
      delivery_days: '3-5',
    };
  }
}
