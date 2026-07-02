import { Test, TestingModule } from '@nestjs/testing';
import { NodemailerMailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

describe('MailService', () => {
  let service: NodemailerMailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerMailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test@arthuila.com'),
          },
        },
      ],
    }).compile();

    service = module.get<NodemailerMailService>(NodemailerMailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
