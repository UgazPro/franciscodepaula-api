import { Module } from '@nestjs/common';
import { TeacherAssignmentController } from './teacher-assignment.controller';
import { TeacherAssignmentService } from './teacher-assignment.service';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [TeacherAssignmentController],
  providers: [TeacherAssignmentService, PrismaService],
})
export class TeacherAssignmentModule {}
