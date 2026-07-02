import { Module } from '@nestjs/common';
import { NodemailerMailService } from './mail.service';
import { MAIL_SERVICE } from './mail.service.interface';

@Module({
  providers: [
    NodemailerMailService,
    {
      provide: MAIL_SERVICE,
      useClass: NodemailerMailService,
    },
  ],
  exports: [NodemailerMailService, MAIL_SERVICE],
})
export class MailModule {}
