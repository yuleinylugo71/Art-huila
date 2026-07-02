import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MAIL_SERVICE } from '../mail/mail.service.interface';
import type { IMailService } from '../mail/mail.service.interface';
import { LoginDto, RegisterDto, RegisterArtisanDto } from './dto/auth.dto';
import { UserRole } from '../common/constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { STORAGE_SERVICE } from '../cloudinary/storage.service.interface';
import type { IStorageService } from '../cloudinary/storage.service.interface';
import {
  ArtisanProfile,
  ArtisanStatus,
} from '../artisans/entities/artisan-profile.entity';
import { Category } from '../categories/entities/category.entity';
import { Region } from '../regions/entities/region.entity';
import { ArtisanGallery } from '../artisans/entities/artisan-gallery.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
    @InjectRepository(ArtisanProfile)
    private readonly artisanRepo: Repository<ArtisanProfile>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  private generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h',
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    return { access_token, refresh_token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // Unified error message (no distinction between wrong email/password)
    const invalidMsg = 'Credenciales incorrectas';

    if (!user) throw new UnauthorizedException(invalidMsg);

    if (user.role === UserRole.ARTISAN) {
      const profile = await this.artisanRepo.findOne({
        where: { user: { id: user.id } },
      });
      if (profile?.verification_status === ArtisanStatus.SUSPENDED) {
        throw new UnauthorizedException(
          'Tu cuenta de artesano se encuentra suspendida',
        );
      }
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intenta en ${minutesLeft} minuto(s)`,
      );
    }

    const passwordMatch = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordMatch) {
      await this.usersService.incrementFailedLogins(user.id);
      throw new UnauthorizedException(invalidMsg);
    }

    // Reset failed attempts on success
    await this.usersService.resetFailedLogins(user.id);

    const tokens = this.generateTokens(user.id, user.role);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async registerBuyer(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.usersService.create({
      full_name: dto.full_name,
      email: dto.email,
      password_hash: passwordHash,
      role: UserRole.BUYER,
      email_verified: true,
    });

    return { message: 'Registro exitoso. ¡Bienvenido!' };
  }

  async registerArtisan(
    dto: RegisterArtisanDto,
    idDocumentFrontFile?: Express.Multer.File,
    idDocumentBackFile?: Express.Multer.File,
    galleryFiles?: Express.Multer.File[],
    clientIp?: string,
  ) {
    try {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const verificationToken = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const expires = new Date();
      expires.setHours(expires.getHours() + 48);

      let category;
      let region;
      try {
        category = dto.category_id
          ? await this.categoryRepo.findOneBy({ id: dto.category_id })
          : null;
        region = dto.region_id
          ? await this.regionRepo.findOneBy({ id: dto.region_id })
          : null;
      } catch (err) {
        throw new BadRequestException(
          'Categoría o región no válida (UUID inválido)',
        );
      }

      if (!category)
        throw new BadRequestException('Categoría o región no válida');
      if (!region)
        throw new BadRequestException('Categoría o región no válida');

      const existingArtisan = await this.artisanRepo.findOne({
        where: { id_number: dto.id_number },
      });
      if (existingArtisan) {
        throw new ConflictException(
          'El número de cédula (ID) ya se encuentra registrado',
        );
      }

      // Upload ID document if exists
      let idDocumentFrontUrl: string | null = null;
      if (idDocumentFrontFile) {
        const upload = await this.storageService.uploadImage(
          idDocumentFrontFile,
          'artisans/documents',
        );
        idDocumentFrontUrl = upload.secure_url;
      }

      let idDocumentBackUrl: string | null = null;
      if (idDocumentBackFile) {
        const upload = await this.storageService.uploadImage(
          idDocumentBackFile,
          'artisans/documents',
        );
        idDocumentBackUrl = upload.secure_url;
      }

      const user = await this.usersService.create({
        full_name: dto.full_name,
        email: dto.email,
        password_hash: passwordHash,
        role: UserRole.ARTISAN,
        email_verified: false,
        email_verification_token: verificationToken,
        email_token_expires_at: expires,
      });

      const profile = this.artisanRepo.create({
        user,
        id_number: dto.id_number,
        cultural_history: dto.cultural_history,
        category,
        region,
        verification_status: ArtisanStatus.PENDING,
        truthfulness_declaration:
          dto.truthfulness_declaration === 'true' ||
          (dto.truthfulness_declaration as any) === true,
        id_document_front_url: idDocumentFrontUrl,
        id_document_back_url: idDocumentBackUrl,
        legal_acceptance_ip: clientIp || null,
        legal_acceptance_timestamp: new Date(),
      });
      const savedProfile = await this.artisanRepo.save(profile);

      // Upload gallery images
      if (galleryFiles && galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const upload = await this.storageService.uploadImage(
            file,
            'artisans/gallery',
          );
          await this.artisanRepo.manager.save(ArtisanGallery, {
            url: upload.secure_url,
            public_id: upload.public_id,
            profile: savedProfile,
          });
        }
      }

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173';
      await this.mailService.sendVerificationEmail(
        user.email,
        user.full_name,
        verificationToken,
        frontendUrl,
      );

      return {
        message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.name === 'QueryFailedError') {
        throw new BadRequestException(
          `Error de base de datos: UUID inválido o violación de restricción`,
        );
      }
      throw new BadRequestException(
        `Error al registrar artesano: ${error.message || error}`,
      );
    }
  }

  async verifyEmail(token: string) {
    const user = await this.usersService['userRepo'].findOne({
      where: { email_verification_token: token },
    });
    if (!user) throw new BadRequestException('Token inválido o expirado');
    if (
      user.email_token_expires_at &&
      user.email_token_expires_at < new Date()
    ) {
      throw new BadRequestException('El token ha expirado');
    }
    user.email_verified = true;
    user.verifiedAt = new Date();
    user.email_verification_token = undefined as any;
    user.email_token_expires_at = undefined as any;
    await this.usersService.save(user);

    const profile = await this.artisanRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (profile && profile.verification_status === ArtisanStatus.PENDING) {
      profile.verification_status = ArtisanStatus.ACTIVE;
      await this.artisanRepo.save(profile);
    }

    return { message: 'Email verificado exitosamente' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user.id, user.role);
    } catch {
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }
  async logout(refreshToken: string) {
    await this.refreshTokenRepo.delete({ token: refreshToken });
    return { message: 'Sesion cerrada correctamente' };
  }

  async requestPasswordReset(email: string) {
    const genericMsg =
      'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.';
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: genericMsg };
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.reset_password_token = token;
    user.reset_password_expires = new Date(Date.now() + 3600000); // 1 hora

    await this.usersService.save(user);

    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        token,
        user.full_name,
      );
    } catch (err) {
      console.error('Error sending password reset email:', err);
    }

    return { message: genericMsg };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (
      !user ||
      !user.reset_password_expires ||
      user.reset_password_expires < new Date()
    ) {
      throw new BadRequestException('Token inválido o expirado');
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.reset_password_token = null as any;
    user.reset_password_expires = null as any;

    await this.usersService.save(user);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
