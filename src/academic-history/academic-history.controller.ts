import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AcademicHistoryService } from './academic-history.service';
import { CreateSchoolHistoryDTO, CreateFailedSubjectAttemptDTO, CreateSchoolHistoryBatchDTO, UpdateSchoolHistoryDTO, UpdateSchoolHistoryBatchDTO } from './academic-history.dto';

@Controller('academic-history')
export class AcademicHistoryController {
  constructor(private service: AcademicHistoryService) {}

  @Get('student/:studentId')
  async getAcademicHistory(@Param('studentId', ParseIntPipe) studentId: number) {
    return await this.service.getAcademicHistory(studentId);
  }

  @Get('failed-subjects')
  async getAllFailedSubjects() {
    return await this.service.getAllFailedSubjects();
  }

  @Post('failed-subject/:id/attempts')
  async addFailedSubjectAttempt(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateFailedSubjectAttemptDTO,
  ) {
    return await this.service.addFailedSubjectAttempt(id, data);
  }

  @Post('school-history')
  async addSchoolHistory(@Body() data: CreateSchoolHistoryDTO) {
    return await this.service.addSchoolHistory(data);
  }

  @Post('school-history/batch')
  async addSchoolHistoryBatch(@Body() data: CreateSchoolHistoryBatchDTO) {
    return await this.service.addSchoolHistoryBatch(data);
  }

  @Put('school-history/batch')
  async updateSchoolHistoryBatch(@Body() data: UpdateSchoolHistoryBatchDTO) {
    return await this.service.updateSchoolHistoryBatch(data);
  }

  @Put('school-history/:id')
  async updateSchoolHistory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSchoolHistoryDTO,
  ) {
    return await this.service.updateSchoolHistory(id, data);
  }

  @Delete('school-history/:id')
  async deleteSchoolHistory(@Param('id', ParseIntPipe) id: number) {
    return await this.service.deleteSchoolHistory(id);
  }
}
