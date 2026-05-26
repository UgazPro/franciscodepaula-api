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

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PaymentsModule,
    EnrollmentModule,
    SchoolYearModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,

    JwtService,

  ],
})
export class AppModule {}
