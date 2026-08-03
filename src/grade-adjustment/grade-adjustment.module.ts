import { Module } from '@nestjs/common';
import { GradeAdjustmentController } from './grade-adjustment.controller';
import { GradeAdjustmentService } from './grade-adjustment.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [GradeAdjustmentController],
  providers: [GradeAdjustmentService, PrismaService, ConfigService],
})
export class GradeAdjustmentModule {}
