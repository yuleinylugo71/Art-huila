import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAllWithCount() {
    return this.categoryRepo.createQueryBuilder('category')
      .loadRelationCountAndMap('category.count', 'category.products')
      .orderBy('category.name', 'ASC')
      .getMany();
  }
}
