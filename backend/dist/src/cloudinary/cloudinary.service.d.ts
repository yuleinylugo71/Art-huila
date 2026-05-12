import { ConfigService } from '@nestjs/config';
export type CloudinaryUploadResult = {
    url: string;
    secure_url: string;
    public_id: string;
};
export declare class CloudinaryService {
    private readonly configService;
    constructor(configService: ConfigService);
    uploadImage(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    deleteImage(publicId: string): Promise<void>;
}
