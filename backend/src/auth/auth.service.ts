import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto, RegisterArtisanDto } from './dto/auth.dto';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { ArtisanProfile, VerificationStatus } from '../artisans/entities/artisan-profile.entity';
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
    private readonly mailService: MailService,
    @InjectRepository(ArtisanProfile)
    private readonly artisanRepo: Repository<ArtisanProfile>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private async uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(upload);
    });
  }

  private getAccessSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'secret';
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET') || this.getAccessSecret();
  }

  private generateAccessToken(userId: string, role: string) {
    return this.jwtService.sign(
      { sub: userId, role },
      {
        secret: this.getAccessSecret(),
        expiresIn: '15m',
      },
    );
  }

  private generateRefreshToken(userId: string, role: string) {
    return this.jwtService.sign(
      { sub: userId, role, typ: 'refresh' },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '24h',
      },
    );
  }

  private async issueRefreshToken(userId: string, role: string) {
    const token = this.generateRefreshToken(userId, role);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId,
        token,
        expiresAt,
      }),
    );

    return token;
  }

  private getRedirectUrlByRole(role: string) {
    const redirects: Record<string, string> = {
      admin: '/admin/dashboard',
      artesano: '/artesano/dashboard',
      comprador: '/catalogo',
    };
    return redirects[role] || '/catalogo';
  }

  private async issueSession(userId: string, role: string) {
    return {
      access_token: this.generateAccessToken(userId, role),
      refresh_token: await this.issueRefreshToken(userId, role),
      redirectUrl: this.getRedirectUrlByRole(role),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const invalidMsg = 'Credenciales incorrectas';

    if (!user) throw new UnauthorizedException(invalidMsg);

    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Cuenta bloqueada. Intenta en ${minutesLeft} minuto(s)`);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordMatch) {
      await this.usersService.incrementFailedLogins(user.id);
      throw new UnauthorizedException(invalidMsg);
    }

    await this.usersService.resetFailedLogins(user.id);

    const tokens = await this.issueSession(user.id, user.role);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
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

    return { message: 'Registro exitoso. Bienvenido!' };
  }

  async registerArtisan(
    dto: RegisterArtisanDto,
    idDocumentFrontFile?: Express.Multer.File,
    idDocumentBackFile?: Express.Multer.File,
    galleryFiles?: Express.Multer.File[],
  ) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 48);

    const category = await this.categoryRepo.findOneBy({ id: dto.category_id });
    if (!category) throw new BadRequestException('Categoria no valida');
    const region = await this.regionRepo.findOneBy({ id: dto.region_id });
    if (!region) throw new BadRequestException('Region no valida');

    let idDocumentFrontUrl = null;
    if (idDocumentFrontFile) {
      const upload = await this.uploadToCloudinary(idDocumentFrontFile, 'artisans/documents');
      idDocumentFrontUrl = upload.secure_url;
    }

    let idDocumentBackUrl = null;
    if (idDocumentBackFile) {
      const upload = await this.uploadToCloudinary(idDocumentBackFile, 'artisans/documents');
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
      id_number: dto.email,
      cultural_history: dto.cultural_history,
      category,
      region,
      verification_status: VerificationStatus.PENDING,
      truthfulness_declaration: dto.truthfulness_declaration === 'true',
      id_document_front_url: idDocumentFrontUrl,
      id_document_back_url: idDocumentBackUrl,
    });
    const savedProfile = await this.artisanRepo.save(profile);

    if (galleryFiles && galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        const upload = await this.uploadToCloudinary(file, 'artisans/gallery');
        await this.artisanRepo.manager.save(ArtisanGallery, {
          url: upload.secure_url,
          public_id: upload.public_id,
          profile: savedProfile,
        });
      }
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    await this.mailService.sendVerificationEmail(user.email, user.full_name, verificationToken, frontendUrl);

    return { message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.' };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService['userRepo'].findOne({
      where: { email_verification_token: token },
    });
    if (!user) throw new BadRequestException('Token invalido o expirado');
    if (user.email_token_expires_at && user.email_token_expires_at < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }
    user.email_verified = true;
    user.email_verification_token = undefined as any;
    user.email_token_expires_at = undefined as any;
    await this.usersService.save(user);
    return { message: 'Email verificado exitosamente' };
  }

  async refresh(refreshToken: string) {
    try {
      const storedToken = await this.refreshTokenRepo.findOneBy({ token: refreshToken });
      if (!storedToken) throw new UnauthorizedException('Token de refresco invalido');

      const now = new Date();
      const inactivityLimit = new Date(now.getTime() - 30 * 60 * 1000);
      if (storedToken.expiresAt <= now || storedToken.createdAt <= inactivityLimit) {
        await this.refreshTokenRepo.delete({ token: refreshToken });
        throw new UnauthorizedException('La sesion ha expirado');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();

      await this.refreshTokenRepo.delete({ token: refreshToken });
      const session = await this.issueSession(user.id, user.role);
      return {
        ...session,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      await this.refreshTokenRepo.delete({ token: refreshToken }).catch(() => undefined);
      throw new UnauthorizedException('Token de refresco invalido');
    }
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepo.delete({ token: refreshToken });
    return { message: 'Sesion cerrada correctamente' };
  }
}
