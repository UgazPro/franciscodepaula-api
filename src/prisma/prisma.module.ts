import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 👈 hace que no tengas que importarlo en todos lados
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}