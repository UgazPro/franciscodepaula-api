import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AcademicHistoryService } from './academic-history.service';
import { CreateSchoolHistoryDTO, CreateFailedSubjectDTO } from './academic-history.dto';

@Controller('academic-history')
export class AcademicHistoryController {
  constructor(private service: AcademicHistoryService) {}

  @Get('student/:studentId')
  async getAcademicHistory(@Param('studentId', ParseIntPipe) studentId: number) {
    return await this.service.getAcademicHistory(studentId);
  }

  @Post('school-history')
  async addSchoolHistory(@Body() data: CreateSchoolHistoryDTO) {
    return await this.service.addSchoolHistory(data);
  }

  @Delete('school-history/:id')
  async deleteSchoolHistory(@Param('id', ParseIntPipe) id: number) {
    return await this.service.deleteSchoolHistory(id);
  }

  @Post('failed-subject')
  async addFailedSubject(@Body() data: CreateFailedSubjectDTO) {
    return await this.service.addFailedSubject(data);
  }

  @Delete('failed-subject/:id')
  async deleteFailedSubject(@Param('id', ParseIntPipe) id: number) {
    return await this.service.deleteFailedSubject(id);
  }
}
