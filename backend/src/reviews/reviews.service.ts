import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(userId: string, data: { productId: string; rating: number; comment: string }) {
    const product = await this.productRepo.findOneBy({ id: data.productId });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const review = this.reviewRepo.create({
      rating: data.rating,
      comment: data.comment,
      product,
      user: { id: userId } as any,
    });
    return this.reviewRepo.save(review);
  }

  async findByProduct(productId: string) {
    return this.reviewRepo.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }
}
