import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRole } from '../users/entities/user.entity';
import { ArtisanStatus } from '../artisans/entities/artisan-profile.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

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
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'new-user', ...data })),
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
      { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() },
      { get: jest.fn().mockReturnValue('secret') },
      { sendVerificationEmail: jest.fn() },
      artisanRepo,
      { findOneBy: jest.fn().mockResolvedValue({ id: 'cat-1' }) },
      { findOneBy: jest.fn().mockResolvedValue({ id: 'reg-1' }) },
    );
  });

  it('registro de artesano deja estado PENDING', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await service.registerArtisan({
      full_name: 'Artesana Huila',
      email: 'artisan@example.com',
      password: 'Password1',
      role: 'artesano',
      cultural_history: 'Historia',
      category_id: 'cat-1',
      region_id: 'reg-1',
      truthfulness_declaration: 'true',
    });

    expect(artisanRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      verification_status: ArtisanStatus.PENDING,
    }));
  });

  it('confirmacion de email cambia estado a ACTIVE', async () => {
    const profile = { id: 'artisan-1', verification_status: ArtisanStatus.PENDING };
    artisanRepo.findOne.mockResolvedValue(profile);

    await service.verifyEmail('email-token');

    expect(usersService.save).toHaveBeenCalledWith(expect.objectContaining({
      email_verified: true,
      verifiedAt: expect.any(Date),
    }));
    expect(artisanRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      verification_status: ArtisanStatus.ACTIVE,
    }));
  });

  it('artesano SUSPENDED no puede iniciar sesion', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    artisanRepo.findOne.mockResolvedValue({ verification_status: ArtisanStatus.SUSPENDED });

    await expect(service.login({ email: user.email, password: 'Password1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
