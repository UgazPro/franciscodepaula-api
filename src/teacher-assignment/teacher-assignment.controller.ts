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
import { TeacherAssignmentService } from './teacher-assignment.service';
import { CreateTeacherAssignmentDTO, UpdateTeacherAssignmentDTO } from './teacher-assignment.dto';

@Controller('teacher-assignments')
export class TeacherAssignmentController {
  constructor(private service: TeacherAssignmentService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get('overview')
  async getOverview() {
    return await this.service.getOverview();
  }

  @Post()
  async create(@Body() data: CreateTeacherAssignmentDTO) {
    return await this.service.create(data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTeacherAssignmentDTO,
  ) {
    return await this.service.update(id, data);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.service.toggleStatus(id);
  }
}
