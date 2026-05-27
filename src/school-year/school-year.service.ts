import { Injectable } from '@nestjs/common';
import { SchoolYearDTO, SectionDTO } from './school-year.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';

@Injectable()
export class SchoolYearService {
  constructor(private prismaService: PrismaService) {}

  async getSchoolYears() {
    try {
      const schoolYears = await this.prismaService.schoolYear.findMany();

      return schoolYears;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createSchoolYear(data: SchoolYearDTO) {
    try {
      const schoolYear = await this.prismaService.schoolYear.create({
        data: {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });

      return schoolYear;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getSchoolYearById(id: number) {
    try {
      const year = await this.prismaService.schoolYear.findUnique({
        where: { id },
        include: {
          periods: true,
          sections: {
            include: {
              level: true,
            },
          },
        },
      });

      return year;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  // Periods
  async getPeriods() {
    try {
      const periods = await this.prismaService.period.findMany();

      return periods;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  // High School Levels
  async getHighSchoolLevels() {
    try {
      const highSchoolLevels = await this.prismaService.highSchoolLevel.findMany();

      return highSchoolLevels;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  // Sections
  async getSections() {
    try {
      const sections = await this.prismaService.section.findMany({
        include: {
          level: true,
          schoolYear: true,
        },

        orderBy: [
          {
            highSchoolLevelId: 'asc',
          },
          {
            section: 'asc',
          },
        ],
      });
      return sections;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getSectionById(id: number) {
    try {
      const section = await this.prismaService.section.findUnique({
        where: { id },

        include: {
          level: true,
          schoolYear: true,
        },
      });
      return section;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createSection(data: SectionDTO) {
    const schoolYear = await this.prismaService.schoolYear.findUnique({
      where: {
        id: data.schoolYearId,
      },
    });

    if (!schoolYear) {
      badResponse.message = 'Año no encontrado.';
      return badResponse;
    }

    const level = await this.prismaService.highSchoolLevel.findUnique({
      where: {
        id: data.highSchoolLevelId,
      },
    });

    if (!level) {
      badResponse.message = 'Nivel no encontrado.';
      return badResponse;
    }

    const exists = await this.prismaService.section.findFirst({
      where: {
        schoolYearId: data.schoolYearId,

        highSchoolLevelId: data.highSchoolLevelId,

        section: data.section,
      },
    });

    if (exists) {
      badResponse.message = 'La sección ya existe.';
      return badResponse;
    }

    return this.prismaService.section.create({
      data: {
        schoolYearId: data.schoolYearId,

        highSchoolLevelId: data.highSchoolLevelId,

        section: data.section,
      },

      include: {
        level: true,
        schoolYear: true,
      },
    });
  }

  async updateSection(id: number, section: SectionDTO) {
    try {
      const updatedSection = await this.prismaService.section.update({
        where: { id },
        data: {
          schoolYearId: section.schoolYearId,
          highSchoolLevelId: section.highSchoolLevelId,
          section: section.section,
        },
        include: {
          level: true,
          schoolYear: true,
        },
      });
      return updatedSection;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
