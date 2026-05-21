import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: any): Promise<import("./entities/user.entity").User | null>;
    updateMe(user: any, updateData: any): Promise<import("./entities/user.entity").User>;
}
