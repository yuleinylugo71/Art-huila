import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getArtisans(status?: string): Promise<import("../artisans/entities/artisan-profile.entity").ArtisanProfile[]>;
    approve(id: string, user: any): Promise<{
        message: string;
    }>;
    reject(id: string, reason: string, user: any): Promise<{
        message: string;
    }>;
    suspend(id: string, user: any): Promise<{
        message: string;
    }>;
}
