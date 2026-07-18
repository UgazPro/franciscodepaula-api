import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const schools = await this.prisma.school.findMany({
        orderBy: { schoolName: 'asc' },
        select: { id: true, schoolName: true, schoolState: true, schoolCity: true, schoolCountry: true },
      });
      return schools;
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }
}
