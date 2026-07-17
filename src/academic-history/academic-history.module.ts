import { Module } from '@nestjs/common';
import { AcademicHistoryController } from './academic-history.controller';
import { AcademicHistoryService } from './academic-history.service';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [AcademicHistoryController],
  providers: [AcademicHistoryService, PrismaService],
})
export class AcademicHistoryModule {}
