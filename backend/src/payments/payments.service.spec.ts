import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn().mockReturnValue('test-value');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
        {
          provide: OrdersService,
          useValue: {
            markPaymentApproved: jest.fn(),
            markPaymentRejected: jest.fn(),
            markPaymentPending: jest.fn(),
            markPaymentFailed: jest.fn(),
            markPaymentCancelled: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns demo preference when ePayco credentials are missing and demo mode is enabled', async () => {
    configGet.mockImplementation((key: string) => {
      if (key === 'EPAYCO_ALLOW_MOCK_PAYMENTS') return 'true';
      return undefined;
    });

    await expect(
      service.createPreference({ total_amount: 10000 } as any),
    ).resolves.toMatchObject({
      mode: 'demo',
      test: true,
    });
  });

  it('rejects missing ePayco credentials when demo mode is disabled', async () => {
    configGet.mockImplementation(() => undefined);

    await expect(
      service.createPreference({ total_amount: 10000 } as any),
    ).rejects.toThrow('Faltan las credenciales de ePayco');
  });
});
