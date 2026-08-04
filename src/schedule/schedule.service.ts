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
}
