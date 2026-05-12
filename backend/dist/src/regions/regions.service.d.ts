import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';
export declare class RegionsService {
    private readonly regionRepo;
    constructor(regionRepo: Repository<Region>);
    findAll(): Promise<Region[]>;
}
