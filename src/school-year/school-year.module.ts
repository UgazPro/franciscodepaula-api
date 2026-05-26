import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [SchoolYearController],
  providers: [SchoolYearService, PrismaService]
})
export class SchoolYearModule {}
