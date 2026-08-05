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
import { CreateScheduleDTO, CreateCRPScheduleDTO, AssignAllCRPDTO } from './schedule.dto';

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

  @Get('crp')
  async getAllCRPSchedules() {
    return await this.service.getAllCRPSchedules();
  }

  @Get('crp/:groupName')
  async getCRPSchedule(@Param('groupName') groupName: string) {
    return await this.service.getCRPSchedule(groupName);
  }

  @Post()
  async assignSchedule(@Body() data: CreateScheduleDTO) {
    return await this.service.assignSchedule(data);
  }

  @Post('crp')
  async assignCRPSchedule(@Body() data: CreateCRPScheduleDTO) {
    return await this.service.assignCRPSchedule(data.groupName, data.scheduleSlotId, data.classroom);
  }

  @Post('crp/all')
  async assignAllCRPSchedule(@Body() data: AssignAllCRPDTO) {
    return await this.service.assignAllCRPSchedule(data.scheduleSlotId, data.classroom);
  }

  @Delete(':id')
  async removeSchedule(@Param('id', ParseIntPipe) id: number) {
    return await this.service.removeSchedule(id);
  }
}
