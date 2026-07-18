import { Controller, Get } from '@nestjs/common';
import { SchoolsService } from './schools.service';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  async findAll() {
    return await this.schoolsService.findAll();
  }
}
