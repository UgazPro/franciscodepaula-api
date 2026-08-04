import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { SchoolYearModule } from './school-year/school-year.module';
import { LocationModule } from './location/location.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeacherAssignmentModule } from './teacher-assignment/teacher-assignment.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { GradeModule } from './grade/grade.module';
import { AcademicHistoryModule } from './academic-history/academic-history.module';
import { SchoolsModule } from './schools/schools.module';
import { GradeAdjustmentModule } from './grade-adjustment/grade-adjustment.module';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    NestScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PaymentsModule,
    EnrollmentModule,
    SchoolYearModule,
    LocationModule,
    SubjectsModule,
    TeacherAssignmentModule,
    EvaluationModule,
    GradeModule,
    AcademicHistoryModule,
    SchoolsModule,
    GradeAdjustmentModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, JwtService],
})
export class AppModule {}
