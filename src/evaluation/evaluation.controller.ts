import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDTO, UpdateEvaluationDTO, AutoAdjustDTO } from './evaluation.dto';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('evaluations')
export class EvaluationController {
  private secretKey: string;

  constructor(
    private service: EvaluationService,
    private configService: ConfigService,
    private prisma: PrismaService,
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

  @Get('types')
  async getEvaluationTypes() {
    return await this.service.getEvaluationTypes();
  }

  @Get('teaching-group/:teachingGroupId')
  async getEvaluationsByTeachingGroup(
    @Param('teachingGroupId', ParseIntPipe) teachingGroupId: number,
    @Query('periodId') periodId?: string,
  ) {
    const parsedPeriodId = periodId ? Number(periodId) : undefined;
    return await this.service.getEvaluationsByTeachingGroup(teachingGroupId, parsedPeriodId);
  }

  @Post()
  async createEvaluation(@Body() data: CreateEvaluationDTO) {
    return await this.service.createEvaluation(data);
  }

  @Post('auto-adjust')
  async autoAdjust(@Body() data: AutoAdjustDTO) {
    return await this.service.autoAdjust(data.teachingGroupId, data.periodId);
  }

  @Put(':id')
  async updateEvaluation(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateEvaluationDTO,
  ) {
    return await this.service.updateEvaluation(id, data);
  }

  @Delete(':id')
  async deleteEvaluation(@Param('id', ParseIntPipe) id: number) {
    return await this.service.deleteEvaluation(id);
  }
}
