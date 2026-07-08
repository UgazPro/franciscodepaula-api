import { Module } from '@nestjs/common';
import { GradeController } from './grade.controller';
import { GradeService } from './grade.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [GradeController],
  providers: [GradeService, PrismaService, ConfigService],
})
export class GradeModule {}
