import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersService } from '../orders/orders.service';
import { MAIL_SERVICE } from '../mail/mail.service.interface';

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: OrdersService,
          useValue: { findByUser: jest.fn() },
        },
        {
          provide: MAIL_SERVICE,
          useValue: { sendReviewResponseEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
