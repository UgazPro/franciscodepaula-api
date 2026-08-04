import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDTO } from './schedule.dto';

@Controller('schedules')
export class ScheduleController {
  constructor(private service: ScheduleService) {}

  @Get('class-hours')
  async getClassHours() {
    return await this.service.getClassHours();
  }

  @Get('teacher/:teacherId')
  async getTeacherSchedule(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return await this.service.getTeacherSchedule(teacherId);
  }

  @Get('section/:sectionId')
  async getSectionSchedule(@Param('sectionId', ParseIntPipe) sectionId: number) {
    return await this.service.getSectionSchedule(sectionId);
  }

  @Post()
  async assignSchedule(@Body() data: CreateScheduleDTO) {
    return await this.service.assignSchedule(data);
  }

  @Delete(':id')
  async removeSchedule(@Param('id', ParseIntPipe) id: number) {
    return await this.service.removeSchedule(id);
  }
}
