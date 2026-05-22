import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Role } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: 'buyer@example.com',
    full_name: 'Comprador Uno',
    role: Role.COMPRADOR,
    password_hash: 'hashed-password',
    locked_until: null,
  };

  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let configService: any;
  let refreshTokenRepo: any;
  let tokenCounter: number;

  beforeEach(() => {
    tokenCounter = 0;
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      findById: jest.fn().mockResolvedValue(user),
      incrementFailedLogins: jest.fn(),
      resetFailedLogins: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    jwtService = {
      sign: jest.fn((_payload, options) => {
        tokenCounter += 1;
        return options.expiresIn === '15m' ? `access-${tokenCounter}` : `refresh-${tokenCounter}`;
      }),
      verify: jest.fn().mockReturnValue({ sub: user.id, role: user.role, typ: 'refresh' }),
    };
    configService = {
      get: jest.fn((key: string) => {
        const values = {
          JWT_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
        };
        return values[key];
      }),
    };
    refreshTokenRepo = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
      findOneBy: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    service = new AuthService(
      usersService,
      jwtService,
      configService,
      { sendVerificationEmail: jest.fn() },
      {} as any,
      {} as any,
      {} as any,
      refreshTokenRepo,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('login exitoso devuelve access token y refresh token', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: user.email,
      password: 'Password1',
    });

    expect(result.access_token).toMatch(/^access-/);
    expect(result.refresh_token).toMatch(/^refresh-/);
    expect(result.redirectUrl).toBe('/catalogo');
    expect(refreshTokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        token: result.refresh_token,
        expiresAt: expect.any(Date),
      }),
    );
  });

  it('refresh token valido devuelve nuevo access token', async () => {
    const oldRefreshToken = 'refresh-token';
    refreshTokenRepo.findOneBy.mockResolvedValue({
      token: oldRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
    });

    const result = await service.refresh(oldRefreshToken);

    expect(result.access_token).toMatch(/^access-/);
    expect(result.refresh_token).toMatch(/^refresh-/);
    expect(refreshTokenRepo.delete).toHaveBeenCalledWith({ token: oldRefreshToken });
    expect(refreshTokenRepo.save).toHaveBeenCalled();
  });

  it('refresh token expirado lanza UnauthorizedException', async () => {
    const expiredRefreshToken = 'expired-refresh-token';
    refreshTokenRepo.findOneBy.mockResolvedValue({
      token: expiredRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    });

    await expect(service.refresh(expiredRefreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshTokenRepo.delete).toHaveBeenCalledWith({ token: expiredRefreshToken });
  });

  it('logout invalida el refresh token', async () => {
    const result = await service.logout('refresh-token');

    expect(refreshTokenRepo.delete).toHaveBeenCalledWith({ token: 'refresh-token' });
    expect(result).toEqual({ message: 'Sesion cerrada correctamente' });
  });
});
