import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    const categories = await this.categoriesService.findAllWithCount();
    const icons = {
      'Tejeduría': '<i class="fa-solid fa-scissors"></i>',
      'Cerámica': '<i class="fa-solid fa-jar"></i>',
      'Talla en madera': '<i class="fa-solid fa-tree"></i>',
      'Orfebrería': '<i class="fa-solid fa-gem"></i>',
      'Sombrerería': '<i class="fa-solid fa-hat-cowboy"></i>',
    };
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.name.toLowerCase().replace(/ /g, '-'),
      icon_emoji: icons[c.name] || '<i class="fa-solid fa-palette"></i>',
      count: c['count'] || 0,
    }));
  }
}
