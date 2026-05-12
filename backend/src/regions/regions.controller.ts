import { Controller, Get } from '@nestjs/common';
import { RegionsService } from './regions.service';

@Controller('api/v1/regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  findAll() {
    return this.regionsService.findAll();
  }
}
