import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { GradeAdjustmentService } from './grade-adjustment.service';
import { GradesReviewService } from './grades-review.service';
import { CreateGradeAdjustmentDTO } from './grade-adjustment.dto';

@Controller('grade-adjustments')
export class GradeAdjustmentController {
  constructor(
    private service: GradeAdjustmentService,
    private gradesReviewService: GradesReviewService,
  ) {}

  @Get('sabana')
  async getSabana(@Query('periodId', ParseIntPipe) periodId: number) {
    return await this.service.getSabana(periodId);
  }

  @Get('grades-review')
  async getGradesReviewSections(
    @Query('periodId', ParseIntPipe) periodId: number,
  ) {
    return await this.gradesReviewService.getSectionsOverview(periodId);
  }

  @Get('grades-review/subject')
  async getSubjectGrades(
    @Query('teachingGroupId', ParseIntPipe) teachingGroupId: number,
    @Query('periodId', ParseIntPipe) periodId: number,
  ) {
    return await this.gradesReviewService.getSubjectGrades(
      teachingGroupId,
      periodId,
    );
  }

  @Get('boletin/definitivas')
  async getBoletinDefinitivas() {
    return await this.service.getBoletinDefinitivas();
  }

  @Post()
  async createAdjustments(@Body() data: CreateGradeAdjustmentDTO) {
    return await this.service.createAdjustments(data);
  }
}
