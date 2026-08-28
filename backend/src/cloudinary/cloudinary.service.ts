import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import * as crypto from 'crypto';

import { IStorageService } from './storage.service.interface';

export type CloudinaryUploadResult = {
  url: string;
  secure_url: string;
  public_id: string;
};

@Injectable()
export class CloudinaryService implements IStorageService {
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    this.apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const result = await this.uploadImage(file, folder);
    return result.secure_url;
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'arthuila',
  ): Promise<CloudinaryUploadResult> {
    if (!this.hasCloudinaryConfig()) {
      return this.uploadLocal(file, folder);
    }

    return new Promise((resolve, reject) => {
      const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
      const upload = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error || !result) {
            this.uploadLocal(file, folder).then(resolve).catch(() =>
              reject(
                new InternalServerErrorException(
                  'Error uploading to Cloudinary',
                ),
              ),
            );
            return;
          }
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(upload);
    });
  }

  private hasCloudinaryConfig(): boolean {
    return Boolean(this.cloudName && this.apiKey && this.apiSecret);
  }

  private async uploadLocal(
    file: Express.Multer.File,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    const cleanFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+/, '');
    const extension = this.getFileExtension(file);
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    const relativeDir = join('uploads', cleanFolder);
    const absoluteDir = join(process.cwd(), 'public', relativeDir);
    const absolutePath = join(absoluteDir, filename);

    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    const publicPath = `/${relativeDir.replace(/\\/g, '/')}/${filename}`;
    return {
      url: publicPath,
      secure_url: publicPath,
      public_id: publicPath,
    };
  }

  private getFileExtension(file: Express.Multer.File): string {
    const originalExtension = extname(file.originalname || '').toLowerCase();
    if (originalExtension) return originalExtension;
    if (file.mimetype === 'application/pdf') return '.pdf';
    if (file.mimetype === 'image/png') return '.png';
    if (file.mimetype === 'image/webp') return '.webp';
    return '.jpg';
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
