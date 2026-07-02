import { ProductsService } from './products.service';
import { ArtisanStatus } from '../artisans/entities/artisan-profile.entity';
import { ProductStatus } from './entities/product.entity';

describe('ProductsService HU-02', () => {
  it('artesano ACTIVE puede publicar productos', async () => {
    const productRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: 'product-1', ...data }),
        ),
    };
    const service = new ProductsService(
      productRepo as any,
      {} as any,
      {
        findByUserId: jest.fn().mockResolvedValue({
          id: 'artisan-1',
          verification_status: ArtisanStatus.ACTIVE,
        }),
      } as any,
    );

    const product = await service.create('user-1', {
      name: 'Sombrero artesanal',
      price: 100000,
      stock: 3,
      category_id: 'cat-1',
      region_id: 'reg-1',
    });

    expect(product.status).toBe(ProductStatus.PUBLISHED);
    expect(product.artisan.verification_status).toBe(ArtisanStatus.ACTIVE);
  });
});
