import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ExchangeTask } from './exchange.task';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, ExchangeTask]
})
export class PaymentsModule {}
