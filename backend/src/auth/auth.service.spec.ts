import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRole } from '../common/constants';
import { ArtisanStatus } from '../artisans/entities/artisan-profile.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const buyerUser = {
    id: 'user-buyer-1',
    email: 'buyer@example.com',
    full_name: 'Comprador Test',
    role: UserRole.BUYER,
    password_hash: 'hashed_password',
    locked_until: null,
    email_verified: true,
    email_verification_token: null,
    email_token_expires_at: null,
    verifiedAt: new Date(),
    failed_login_attempts: 0,
  };

  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let configService: any;
  let mailService: any;
  let artisanRepo: any;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      incrementFailedLogins: jest.fn(),
      resetFailedLogins: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: 'new-user', ...data }),
        ),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      userRepo: {
        findOne: jest.fn().mockResolvedValue(null),
      },
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('secret'),
    };
    mailService = {
      sendVerificationEmail: jest.fn(),
    };
    artisanRepo = {
      create: jest.fn((data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findOne: jest.fn().mockResolvedValue(null),
    };

    service = new AuthService(
      usersService,
      jwtService,
      configService,
      mailService,
      artisanRepo,
      { findOneBy: jest.fn().mockResolvedValue({ id: 'cat-1' }) } as any,
      { findOneBy: jest.fn().mockResolvedValue({ id: 'reg-1' }) } as any,
      { delete: jest.fn(), save: jest.fn() } as any,
      { uploadImage: jest.fn(), deleteImage: jest.fn() } as any,
    );
  });

  describe('login', () => {
    it('loguea un usuario comprador correctamente', async () => {
      usersService.findByEmail.mockResolvedValue(buyerUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: buyerUser.email,
        password: 'Password123',
      });

      expect(result.access_token).toBe('token');
      expect(result.refresh_token).toBe('token');
      expect(result.user.email).toBe(buyerUser.email);
    });

    it('fallo con credenciales incorrectas lanza UnauthorizedException', async () => {
      usersService.findByEmail.mockResolvedValue(buyerUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: buyerUser.email, password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('usuario no existente lanza UnauthorizedException', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('cuenta bloqueada lanza UnauthorizedException', async () => {
      const lockedUser = {
        ...buyerUser,
        locked_until: new Date(Date.now() + 60000),
      };
      usersService.findByEmail.mockResolvedValue(lockedUser);

      await expect(
        service.login({ email: lockedUser.email, password: 'password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('refresca tokens correctamente', async () => {
      const refreshPayload = { sub: buyerUser.id, role: buyerUser.role };
      jwtService.verify.mockReturnValue(refreshPayload);
      usersService.findById.mockResolvedValue(buyerUser);

      const result = await service.refresh('valid_refresh_token');

      expect(result.access_token).toBe('token');
      expect(result.refresh_token).toBe('token');
    });

    it('token de refresco invalido lanza UnauthorizedException', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid_token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});

describe('AuthService HU-02', () => {
  const user = {
    id: 'user-1',
    email: 'artisan@example.com',
    full_name: 'Artesana Huila',
    role: UserRole.ARTISAN,
    password_hash: 'hashed',
    locked_until: null,
    email_verified: false,
    email_verification_token: 'email-token',
    email_token_expires_at: new Date(Date.now() + 60_000),
    verifiedAt: null,
  };

  let service: AuthService;
  let usersService: any;
  let artisanRepo: any;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      incrementFailedLogins: jest.fn(),
      resetFailedLogins: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: 'new-user', ...data }),
        ),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      userRepo: {
        findOne: jest.fn().mockResolvedValue(user),
      },
    };
    artisanRepo = {
      create: jest.fn((data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findOne: jest.fn(),
    };

    service = new AuthService(
      usersService,
      { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() } as any,
      { get: jest.fn().mockReturnValue('secret') } as any,
      { sendVerificationEmail: jest.fn() } as any,
      artisanRepo,
      { findOneBy: jest.fn().mockResolvedValue({ id: 'cat-1' }) } as any,
      { findOneBy: jest.fn().mockResolvedValue({ id: 'reg-1' }) } as any,
      { delete: jest.fn(), save: jest.fn() } as any,
      { uploadImage: jest.fn(), deleteImage: jest.fn() } as any,
    );
  });

  it('registro de artesano deja estado PENDING', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await service.registerArtisan({
      full_name: 'Artesana Huila',
      email: 'artisan@example.com',
      password: 'Password1',
      role: 'artesano',
      id_number: '12345678',
      cultural_history: 'Historia',
      category_id: 'cat-1',
      region_id: 'reg-1',
      truthfulness_declaration: 'true',
    });

    expect(artisanRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_status: ArtisanStatus.PENDING,
      }),
    );
  });

  it('confirmacion de email cambia estado a ACTIVE', async () => {
    const profile = {
      id: 'artisan-1',
      verification_status: ArtisanStatus.PENDING,
    };
    artisanRepo.findOne.mockResolvedValue(profile);

    await service.verifyEmail('email-token');

    expect(usersService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email_verified: true,
        verifiedAt: expect.any(Date),
      }),
    );
    expect(artisanRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_status: ArtisanStatus.ACTIVE,
      }),
    );
  });

  it('artesano SUSPENDED no puede iniciar sesion', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    artisanRepo.findOne.mockResolvedValue({
      verification_status: ArtisanStatus.SUSPENDED,
    });

    await expect(
      service.login({ email: user.email, password: 'Password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
