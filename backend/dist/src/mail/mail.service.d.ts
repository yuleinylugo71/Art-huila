import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private resend;
    private fromEmail;
    constructor(configService: ConfigService);
    sendVerificationEmail(to: string, name: string, token: string, frontendUrl: string): Promise<void>;
    sendArtisanApprovalEmail(to: string, name: string): Promise<void>;
    sendArtisanRejectionEmail(to: string, name: string, reason: string): Promise<void>;
    sendArtisanSuspensionEmail(to: string, name: string): Promise<void>;
}
