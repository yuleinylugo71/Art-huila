import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { existsSync } from 'fs';
import { join } from 'path';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-value') },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('falls back to local storage when Cloudinary is not configured', async () => {
    const fallbackModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();
    const fallbackService =
      fallbackModule.get<CloudinaryService>(CloudinaryService);

    const result = await fallbackService.uploadImage(
      {
        buffer: Buffer.from('fake image'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File,
      'test/uploads',
    );

    expect(result.secure_url).toMatch(/^\/uploads\/test\/uploads\/.+\.jpg$/);
    expect(existsSync(join(process.cwd(), 'public', result.secure_url))).toBe(
      true,
    );
  });
});
