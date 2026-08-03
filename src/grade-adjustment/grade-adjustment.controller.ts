import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { GradeAdjustmentService } from './grade-adjustment.service';
import { CreateGradeAdjustmentDTO } from './grade-adjustment.dto';

@Controller('grade-adjustments')
export class GradeAdjustmentController {
  constructor(private service: GradeAdjustmentService) {}

  @Get('sabana')
  async getSabana(@Query('periodId', ParseIntPipe) periodId: number) {
    return await this.service.getSabana(periodId);
  }

  @Post()
  async createAdjustments(@Body() data: CreateGradeAdjustmentDTO) {
    return await this.service.createAdjustments(data);
  }
}
