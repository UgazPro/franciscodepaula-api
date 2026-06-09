import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ExchangeTask {
  private readonly logger = new Logger(ExchangeTask.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Cron('0 */2 * * *')
  async syncDolarRate() {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (!res.ok) {
        this.logger.warn(`dolarapi responded with ${res.status}`);
        return;
      }

      const data = await res.json();
      const newRate = data.promedio;

      const lastExchange = await this.prismaService.exchange.findFirst({
        orderBy: { date: 'desc' },
      });

      const lastRate = lastExchange ? Number(lastExchange.rate) : 0;

      if (newRate !== lastRate) {
        await this.prismaService.exchange.create({
          data: {
            rate: newRate,
            date: new Date(data.fechaActualizacion),
          },
        });
        this.logger.debug(`Tasa del dólar actualizada: ${lastRate} → ${newRate}`);
      }
    } catch (error: any) {
      this.logger.error('Error al sincronizar tasa del dólar', error.message);
    }
  }
}
