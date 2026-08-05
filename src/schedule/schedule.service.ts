import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateScheduleDTO } from './schedule.dto';
import { badResponse } from '@/utilities/base.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async getClassHours() {
    try {
      const hours = await this.prisma.classHour.findMany({
        orderBy: { block: 'asc' },
      });
      return { success: true, message: 'OK', data: hours };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getTeacherSchedule(teacherId: number) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });
      if (!activeSchoolYear) {
        return { success: false, message: 'No hay año escolar activo', data: [] };
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: { teacherId, schoolYearId: activeSchoolYear.id, status: true },
        include: {
          levelSubject: { include: { subject: true, highSchoolLevel: true } },
          section: { include: { highSchoolLevel: true } },
          teachingGroupSchedules: {
            include: {
              scheduleSlot: {
                include: { classHour: true },
              },
            },
          },
        },
      });

      const schedules = teachingGroups.flatMap((tg) =>
        tg.teachingGroupSchedules.map((tgs) => ({
          id: tgs.id,
          teachingGroupId: tg.id,
          subject: tg.levelSubject.subject.subject,
          subjectCode: tg.levelSubject.subject.code,
          level: tg.levelSubject.highSchoolLevel.level,
          section: tg.section ? tg.section.section : null,
          groupName: tg.groupName,
          isSpecialGroup: tg.isSpecialGroup,
          slotId: tgs.scheduleSlot.id,
          dayOfWeek: tgs.scheduleSlot.dayOfWeek,
          block: tgs.scheduleSlot.classHour.block,
          startTime: tgs.scheduleSlot.classHour.startTime,
          endTime: tgs.scheduleSlot.classHour.endTime,
          classroom: tgs.classroom,
        })),
      );

      return { success: true, message: 'OK', data: schedules };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getSectionSchedule(sectionId: number) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });
      if (!activeSchoolYear) {
        return { success: false, message: 'No hay año escolar activo', data: [] };
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: { sectionId, schoolYearId: activeSchoolYear.id, status: true },
        include: {
          levelSubject: { include: { subject: true, highSchoolLevel: true } },
          employee: { include: { user: { include: { person: true } } } },
          teachingGroupSchedules: {
            include: {
              scheduleSlot: {
                include: { classHour: true },
              },
            },
          },
        },
      });

      const schedules = teachingGroups.flatMap((tg) =>
        tg.teachingGroupSchedules.map((tgs) => ({
          id: tgs.id,
          teachingGroupId: tg.id,
          subject: tg.levelSubject.subject.subject,
          subjectCode: tg.levelSubject.subject.code,
          teacherName: tg.employee
            ? `${tg.employee.user.person.firstNames} ${tg.employee.user.person.lastNames}`
            : 'Sin asignar',
          level: tg.levelSubject.highSchoolLevel.level,
          groupName: tg.groupName,
          isSpecialGroup: tg.isSpecialGroup,
          slotId: tgs.scheduleSlot.id,
          dayOfWeek: tgs.scheduleSlot.dayOfWeek,
          block: tgs.scheduleSlot.classHour.block,
          startTime: tgs.scheduleSlot.classHour.startTime,
          endTime: tgs.scheduleSlot.classHour.endTime,
          classroom: tgs.classroom,
        })),
      );

      return { success: true, message: 'OK', data: schedules };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async assignSchedule(data: CreateScheduleDTO) {
    try {
      const existing = await this.prisma.teachingGroupSchedule.findUnique({
        where: {
          teachingGroupId_scheduleSlotId: {
            teachingGroupId: data.teachingGroupId,
            scheduleSlotId: data.scheduleSlotId,
          },
        },
      });
      if (existing) {
        return { success: false, message: 'Este grupo ya tiene asignado este horario', data: null };
      }

      const tg = await this.prisma.teachingGroup.findUnique({
        where: { id: data.teachingGroupId },
        include: {
          employee: true,
          section: true,
        },
      });
      if (!tg) {
        return { success: false, message: 'Grupo de enseñanza no encontrado', data: null };
      }

      const slot = await this.prisma.scheduleSlot.findUnique({
        where: { id: data.scheduleSlotId },
      });
      if (!slot) {
        return { success: false, message: 'Slot de horario no encontrado', data: null };
      }

      const conflictingTeacherSchedule = await this.prisma.teachingGroupSchedule.findFirst({
        where: {
          scheduleSlotId: data.scheduleSlotId,
          teachingGroup: {
            teacherId: tg.teacherId,
            id: { not: data.teachingGroupId },
            status: true,
          },
        },
      });
      if (conflictingTeacherSchedule) {
        return { success: false, message: 'El docente ya tiene otro grupo asignado en este horario', data: null };
      }

      if (tg.sectionId) {
        const conflictingSectionSchedule = await this.prisma.teachingGroupSchedule.findFirst({
          where: {
            scheduleSlotId: data.scheduleSlotId,
            teachingGroup: {
              sectionId: tg.sectionId,
              id: { not: data.teachingGroupId },
              status: true,
            },
          },
        });
        if (conflictingSectionSchedule) {
          return { success: false, message: 'La sección ya tiene otra materia asignada en este horario', data: null };
        }
      }

      const schedule = await this.prisma.teachingGroupSchedule.create({
        data: {
          teachingGroupId: data.teachingGroupId,
          scheduleSlotId: data.scheduleSlotId,
          classroom: data.classroom,
        },
        include: {
          scheduleSlot: { include: { classHour: true } },
          teachingGroup: {
            include: {
              levelSubject: { include: { subject: true } },
            },
          },
        },
      });

      return { success: true, message: 'Horario asignado exitosamente', data: schedule };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async removeSchedule(id: number) {
    try {
      const existing = await this.prisma.teachingGroupSchedule.findUnique({
        where: { id },
      });
      if (!existing) {
        return { success: false, message: 'Horario no encontrado', data: null };
      }

      await this.prisma.teachingGroupSchedule.delete({ where: { id } });
      return { success: true, message: 'Horario removido exitosamente', data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getCRPSchedule(groupName: string) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });
      if (!activeSchoolYear) {
        return { success: false, message: 'No hay año escolar activo', data: [] };
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          groupName,
          isSpecialGroup: true,
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
        include: {
          levelSubject: { include: { subject: true, highSchoolLevel: true } },
          employee: { include: { user: { include: { person: true } } } },
          teachingGroupSchedules: {
            include: {
              scheduleSlot: {
                include: { classHour: true },
              },
            },
          },
        },
      });

      const schedules = teachingGroups.flatMap((tg) =>
        tg.teachingGroupSchedules.map((tgs) => ({
          id: tgs.id,
          teachingGroupId: tg.id,
          subject: tg.levelSubject.subject.subject,
          subjectCode: tg.levelSubject.subject.code,
          teacherName: tg.employee
            ? `${tg.employee.user.person.firstNames} ${tg.employee.user.person.lastNames}`
            : 'Sin asignar',
          level: tg.levelSubject.highSchoolLevel.level,
          groupName: tg.groupName,
          isSpecialGroup: tg.isSpecialGroup,
          slotId: tgs.scheduleSlot.id,
          dayOfWeek: tgs.scheduleSlot.dayOfWeek,
          block: tgs.scheduleSlot.classHour.block,
          startTime: tgs.scheduleSlot.classHour.startTime,
          endTime: tgs.scheduleSlot.classHour.endTime,
          classroom: tgs.classroom,
        })),
      );

      return { success: true, message: 'OK', data: schedules };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async assignCRPSchedule(groupName: string, scheduleSlotId: number, classroom?: string) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });
      if (!activeSchoolYear) {
        return { success: false, message: 'No hay año escolar activo', data: null };
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          groupName,
          isSpecialGroup: true,
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
      });

      if (!teachingGroups.length) {
        return { success: false, message: 'No se encontraron grupos para este CRP', data: null };
      }

      const slot = await this.prisma.scheduleSlot.findUnique({
        where: { id: scheduleSlotId },
      });
      if (!slot) {
        return { success: false, message: 'Slot de horario no encontrado', data: null };
      }

      const results: { teachingGroupId: number; success: boolean; message: string }[] = [];

      for (const tg of teachingGroups) {
        const existing = await this.prisma.teachingGroupSchedule.findUnique({
          where: {
            teachingGroupId_scheduleSlotId: {
              teachingGroupId: tg.id,
              scheduleSlotId,
            },
          },
        });
        if (existing) {
          results.push({ teachingGroupId: tg.id, success: false, message: 'Ya tiene este horario' });
          continue;
        }

        const conflictingTeacher = await this.prisma.teachingGroupSchedule.findFirst({
          where: {
            scheduleSlotId,
            teachingGroup: {
              teacherId: tg.teacherId,
              id: { not: tg.id },
              status: true,
            },
          },
        });
        if (conflictingTeacher) {
          results.push({ teachingGroupId: tg.id, success: false, message: 'Docente con conflicto' });
          continue;
        }

        await this.prisma.teachingGroupSchedule.create({
          data: {
            teachingGroupId: tg.id,
            scheduleSlotId,
            classroom,
          },
        });
        results.push({ teachingGroupId: tg.id, success: true, message: 'Asignado' });
      }

      const allAssigned = results.every((r) => r.success);
      const noneAssigned = results.every((r) => !r.success);

      if (noneAssigned) {
        return { success: false, message: 'Ningún nivel pudo ser asignado (conflictos)', data: results };
      }

      return {
        success: true,
        message: allAssigned
          ? 'CRP asignado a todos los niveles'
          : 'CRP asignado parcialmente (algunos niveles tenían conflictos)',
        data: results,
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getAllCRPSchedules() {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });
      if (!activeSchoolYear) {
        return { success: false, message: 'No hay año escolar activo', data: [] };
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          isSpecialGroup: true,
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
        include: {
          levelSubject: { include: { subject: true, highSchoolLevel: true } },
          employee: { include: { user: { include: { person: true } } } },
          teachingGroupSchedules: {
            include: {
              scheduleSlot: {
                include: { classHour: true },
              },
            },
          },
        },
      });

      const schedules = teachingGroups.flatMap((tg) =>
        tg.teachingGroupSchedules.map((tgs) => ({
          id: tgs.id,
          teachingGroupId: tg.id,
          subject: tg.levelSubject.subject.subject,
          subjectCode: tg.levelSubject.subject.code,
          teacherName: tg.employee
            ? `${tg.employee.user.person.firstNames} ${tg.employee.user.person.lastNames}`
            : 'Sin asignar',
          level: tg.levelSubject.highSchoolLevel.level,
          groupName: tg.groupName,
          isSpecialGroup: tg.isSpecialGroup,
          slotId: tgs.scheduleSlot.id,
          dayOfWeek: tgs.scheduleSlot.dayOfWeek,
          block: tgs.scheduleSlot.classHour.block,
          startTime: tgs.scheduleSlot.classHour.startTime,
          endTime: tgs.scheduleSlot.classHour.endTime,
          classroom: tgs.classroom,
        })),
      );

      return { success: true, message: 'OK', data: schedules };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async assignAllCRPSchedule(scheduleSlotId: number, classroom?: string) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });
      if (!activeSchoolYear) {
        return { success: false, message: 'No hay año escolar activo', data: null };
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          isSpecialGroup: true,
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
      });

      if (!teachingGroups.length) {
        return { success: false, message: 'No se encontraron CRPs activos', data: null };
      }

      const slot = await this.prisma.scheduleSlot.findUnique({
        where: { id: scheduleSlotId },
      });
      if (!slot) {
        return { success: false, message: 'Slot de horario no encontrado', data: null };
      }

      const results: { teachingGroupId: number; groupName: string; success: boolean; message: string }[] = [];

      for (const tg of teachingGroups) {
        const existing = await this.prisma.teachingGroupSchedule.findUnique({
          where: {
            teachingGroupId_scheduleSlotId: {
              teachingGroupId: tg.id,
              scheduleSlotId,
            },
          },
        });
        if (existing) {
          results.push({ teachingGroupId: tg.id, groupName: tg.groupName ?? '', success: false, message: 'Ya tiene este horario' });
          continue;
        }

        const conflictingTeacher = await this.prisma.teachingGroupSchedule.findFirst({
          where: {
            scheduleSlotId,
            teachingGroup: {
              teacherId: tg.teacherId,
              id: { not: tg.id },
              status: true,
            },
          },
        });
        if (conflictingTeacher) {
          results.push({ teachingGroupId: tg.id, groupName: tg.groupName ?? '', success: false, message: 'Docente con conflicto' });
          continue;
        }

        await this.prisma.teachingGroupSchedule.create({
          data: {
            teachingGroupId: tg.id,
            scheduleSlotId,
            classroom,
          },
        });
        results.push({ teachingGroupId: tg.id, groupName: tg.groupName ?? '', success: true, message: 'Asignado' });
      }

      const allAssigned = results.every((r) => r.success);
      const noneAssigned = results.every((r) => !r.success);

      if (noneAssigned) {
        return { success: false, message: 'Ningún CRP pudo ser asignado (conflictos)', data: results };
      }

      return {
        success: true,
        message: allAssigned
          ? 'Todos los CRPs asignados al horario'
          : 'CRPs asignados parcialmente (algunos tenían conflictos)',
        data: results,
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
