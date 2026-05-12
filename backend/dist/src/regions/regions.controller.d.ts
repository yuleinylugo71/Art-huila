import { RegionsService } from './regions.service';
export declare class RegionsController {
    private readonly regionsService;
    constructor(regionsService: RegionsService);
    findAll(): Promise<import("./entities/region.entity").Region[]>;
}
