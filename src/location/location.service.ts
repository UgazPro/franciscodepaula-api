import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async getCountries() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  async getStates(countryId: number) {
    return this.prisma.state.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
    });
  }

  async getMunicipalities(stateId: number) {
    return this.prisma.municipality.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
    });
  }

  async getParishes(municipalityId: number) {
    return this.prisma.parish.findMany({
      where: { municipalityId },
      orderBy: { name: 'asc' },
    });
  }
}
