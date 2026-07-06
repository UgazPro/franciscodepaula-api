import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService, PrismaService, ConfigService],
})
export class EvaluationModule {}
