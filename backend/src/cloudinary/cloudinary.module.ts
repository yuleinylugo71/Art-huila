import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

import { STORAGE_SERVICE } from './storage.service.interface';

@Module({
  providers: [
    CloudinaryService,
    {
      provide: STORAGE_SERVICE,
      useClass: CloudinaryService,
    },
  ],
  exports: [CloudinaryService, STORAGE_SERVICE],
})
export class CloudinaryModule {}
