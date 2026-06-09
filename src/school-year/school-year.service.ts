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
      const existing = await this.prismaService.schoolYear.findFirst({
        where: { name: data.name },
      });

      if (existing) {
        badResponse.message = 'Ya existe un año escolar con ese nombre.';
        return badResponse;
      }

      const schoolYear = await this.prismaService.schoolYear.create({
        data: {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: false,
        },
      });

      return { success: true, message: 'Año escolar creado exitosamente', data: schoolYear };
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

      if (data.name !== undefined) {
        const duplicate = await this.prismaService.schoolYear.findFirst({
          where: { name: data.name, NOT: { id } },
        });

        if (duplicate) {
          badResponse.message = 'Ya existe un año escolar con ese nombre.';
          return badResponse;
        }
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

      return { success: true, message: 'Año escolar actualizado exitosamente', data: updated };
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

      return { success: true, message: 'Estado del año escolar actualizado', data: updated };
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

      const section = await this.prismaService.section.create({
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

      return { success: true, message: 'Sección creada exitosamente', data: section };
    }

  async updateSection(id: number, section: SectionDTO) {
    try {
      const existing = await this.prismaService.section.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Sección no encontrada.';
        return badResponse;
      }

      const duplicate = await this.prismaService.section.findFirst({
        where: {
          schoolYearId: section.schoolYearId,
          highSchoolLevelId: section.highSchoolLevelId,
          section: section.section,
          NOT: { id },
        },
      });

      if (duplicate) {
        badResponse.message = 'La sección ya existe en este año escolar y nivel.';
        return badResponse;
      }

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
      return { success: true, message: 'Sección actualizada exitosamente', data: updatedSection };
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

      return { success: true, message: 'Sección eliminada exitosamente', data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  // High School Levels CRUD
  async createLevel(data: HighSchoolLevelDTO) {
    try {
      const existing = await this.prismaService.highSchoolLevel.findFirst({
        where: { level: data.level },
      });

      if (existing) {
        badResponse.message = 'Ya existe un nivel con ese nombre.';
        return badResponse;
      }

      const level = await this.prismaService.highSchoolLevel.create({
        data: {
          level: data.level,
        },
      });

      return { success: true, message: 'Nivel creado exitosamente', data: level };
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

      const duplicate = await this.prismaService.highSchoolLevel.findFirst({
        where: { level: data.level, NOT: { id } },
      });

      if (duplicate) {
        badResponse.message = 'Ya existe un nivel con ese nombre.';
        return badResponse;
      }

      const updated = await this.prismaService.highSchoolLevel.update({
        where: { id },
        data: {
          level: data.level,
        },
      });

      return { success: true, message: 'Nivel actualizado exitosamente', data: updated };
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

      return { success: true, message: 'Nivel eliminado exitosamente', data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
