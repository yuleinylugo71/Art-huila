export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
  deleteFile(publicId: string): Promise<void>;
  uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ url: string; secure_url: string; public_id: string }>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
