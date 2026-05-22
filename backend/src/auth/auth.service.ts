import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
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
import { ArtisanProfile, ArtisanStatus } from '../artisans/entities/artisan-profile.entity';
import { Category } from '../categories/entities/category.entity';
import { Region } from '../regions/entities/region.entity';
import { ArtisanGallery } from '../artisans/entities/artisan-gallery.entity';

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
      const profile = await this.artisanRepo.findOne({ where: { user: { id: user.id } } });
      if (profile?.verification_status === ArtisanStatus.SUSPENDED) {
        throw new UnauthorizedException('Tu cuenta de artesano se encuentra suspendida');
      }
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Cuenta bloqueada. Intenta en ${minutesLeft} minuto(s)`);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordMatch) {
      await this.usersService.incrementFailedLogins(user.id);
      throw new UnauthorizedException(invalidMsg);
    }

    // Reset failed attempts on success
    await this.usersService.resetFailedLogins(user.id);

    const tokens = this.generateTokens(user.id, user.role);
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

    return { message: 'Registro exitoso. ¡Bienvenido!' };
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
    if (!category) throw new BadRequestException('Categoría no válida');
    const region = await this.regionRepo.findOneBy({ id: dto.region_id });
    if (!region) throw new BadRequestException('Región no válida');

    // Upload ID document if exists
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
      id_number: dto.email, // Use email as fallback for unique id_number if not provided
      cultural_history: dto.cultural_history,
      category,
      region,
      verification_status: ArtisanStatus.PENDING,
      truthfulness_declaration: dto.truthfulness_declaration === 'true',
      id_document_front_url: idDocumentFrontUrl,
      id_document_back_url: idDocumentBackUrl,
    });
    const savedProfile = await this.artisanRepo.save(profile);

    // Upload gallery images
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
    if (!user) throw new BadRequestException('Token inválido o expirado');
    if (user.email_token_expires_at && user.email_token_expires_at < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }
    user.email_verified = true;
    user.verifiedAt = new Date();
    user.email_verification_token = undefined as any;
    user.email_token_expires_at = undefined as any;
    await this.usersService.save(user);

    const profile = await this.artisanRepo.findOne({ where: { user: { id: user.id } } });
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
}
