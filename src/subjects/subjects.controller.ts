import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDTO, UpdateSubjectDTO } from './subjects.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Get()
  async findAll() {
    return await this.subjectsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.subjectsService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateSubjectDTO) {
    return await this.subjectsService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSubjectDTO,
  ) {
    return await this.subjectsService.update(id, data);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.subjectsService.toggleStatus(id);
  }
}
