import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSchoolYearDTO, UpdateSchoolYearDTO, SectionDTO, HighSchoolLevelDTO } from './school-year.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';

@Injectable()
export class SchoolYearService {
  constructor(private prismaService: PrismaService) {}

  async getSchoolYears() {
    try {
      const schoolYears = await this.prismaService.schoolYear.findMany({
        include: {
          _count: {
            select: {
              sections: true,
              enrollments: true,
              periods: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      });

      return schoolYears;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createSchoolYear(data: CreateSchoolYearDTO) {
    try {
      const schoolYear = await this.prismaService.schoolYear.create({
        data: {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: false,
        },
      });

      return schoolYear;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateSchoolYear(id: number, data: UpdateSchoolYearDTO) {
    try {
      const existing = await this.prismaService.schoolYear.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Año escolar no encontrado.';
        return badResponse;
      }

      if (data.isActive === true) {
        await this.prismaService.schoolYear.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      const updated = await this.prismaService.schoolYear.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      return updated;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async toggleSchoolYearActive(id: number) {
    try {
      const existing = await this.prismaService.schoolYear.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Año escolar no encontrado.';
        return badResponse;
      }

      const newActive = !existing.isActive;

      if (newActive) {
        await this.prismaService.schoolYear.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      const updated = await this.prismaService.schoolYear.update({
        where: { id },
        data: { isActive: newActive },
      });

      return updated;
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
              highSchoolLevel: true,
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

  async getActiveSchoolYear() {
    const sy = await this.prismaService.schoolYear.findFirst({
      where: { isActive: true },
    });
    if (!sy) {
      throw new NotFoundException('No hay un año escolar activo');
    }
    return sy;
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
          highSchoolLevel: true,
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
          highSchoolLevel: true,
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
        highSchoolLevel: true,
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
          highSchoolLevel: true,
          schoolYear: true,
        },
      });
      return updatedSection;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async deleteSection(id: number) {
    try {
      const existing = await this.prismaService.section.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Sección no encontrada.';
        return badResponse;
      }

      await this.prismaService.section.delete({
        where: { id },
      });

      return { message: 'Sección eliminada correctamente.' };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  // High School Levels CRUD
  async createLevel(data: HighSchoolLevelDTO) {
    try {
      const level = await this.prismaService.highSchoolLevel.create({
        data: {
          level: data.level,
        },
      });

      return level;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateLevel(id: number, data: HighSchoolLevelDTO) {
    try {
      const existing = await this.prismaService.highSchoolLevel.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Nivel no encontrado.';
        return badResponse;
      }

      const updated = await this.prismaService.highSchoolLevel.update({
        where: { id },
        data: {
          level: data.level,
        },
      });

      return updated;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async deleteLevel(id: number) {
    try {
      const existing = await this.prismaService.highSchoolLevel.findUnique({
        where: { id },
        include: {
          _count: {
            select: { sections: true },
          },
        },
      });

      if (!existing) {
        badResponse.message = 'Nivel no encontrado.';
        return badResponse;
      }

      if (existing._count.sections > 0) {
        badResponse.message = `No se puede eliminar el nivel porque tiene ${existing._count.sections} sección(es) asociada(s). Elimínalas primero.`;
        return badResponse;
      }

      await this.prismaService.highSchoolLevel.delete({
        where: { id },
      });

      return { message: 'Nivel eliminado correctamente.' };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
