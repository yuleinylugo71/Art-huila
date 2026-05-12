import { ArtisansService } from '../artisans/artisans.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
export declare class AdminService {
    private readonly artisansService;
    private readonly mailService;
    private readonly auditService;
    private readonly usersService;
    constructor(artisansService: ArtisansService, mailService: MailService, auditService: AuditService, usersService: UsersService);
    getArtisans(status?: string): Promise<import("../artisans/entities/artisan-profile.entity").ArtisanProfile[]>;
    approveArtisan(adminId: string, artisanProfileId: string): Promise<{
        message: string;
    }>;
    rejectArtisan(adminId: string, artisanProfileId: string, reason: string): Promise<{
        message: string;
    }>;
    suspendArtisan(adminId: string, artisanProfileId: string): Promise<{
        message: string;
    }>;
}
