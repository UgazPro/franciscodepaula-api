import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [StudentsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
