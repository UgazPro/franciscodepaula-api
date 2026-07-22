import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { GradeService } from './grade.service';
import { SaveGradesDTO } from './grade.dto';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Controller('grades')
export class GradeController {
  private secretKey: string;

  constructor(
    private service: GradeService,
    private configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('JWT_SECRET_KEY') as string;
  }

  private async getUserFromToken(authHeader: string | undefined) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, this.secretKey) as { id: number };
      return decoded.id;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  @Get('teacher-planning')
  async getTeacherPlanning(@Headers('authorization') authHeader: string | undefined) {
    const userId = await this.getUserFromToken(authHeader);
    return await this.service.getTeacherPlanning(userId);
  }

  @Get('teachers-overview')
  async getTeachersOverview(@Query('periodId') periodId?: string) {
    const parsedPeriodId = periodId ? Number(periodId) : undefined;
    return await this.service.getTeachersOverview(parsedPeriodId);
  }

  @Get('teaching-group/:teachingGroupId')
  async getGradeDetail(
    @Param('teachingGroupId', ParseIntPipe) teachingGroupId: number,
    @Query('periodId') periodId?: string,
  ) {
    const parsedPeriodId = periodId ? Number(periodId) : undefined;
    return await this.service.getGradeDetail(teachingGroupId, parsedPeriodId);
  }

  @Post()
  async saveGrades(@Body() data: SaveGradesDTO) {
    return await this.service.saveGrades(data);
  }
}
