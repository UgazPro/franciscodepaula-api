import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTeacherAssignmentDTO, UpdateTeacherAssignmentDTO } from './teacher-assignment.dto';
import { badResponse } from '@/utilities/base.dto';

@Injectable()
export class TeacherAssignmentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.teacherSubjectSection.findMany({
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          subject: true,
          section: {
            include: { highSchoolLevel: true, schoolYear: true },
          },
        },
        orderBy: { id: 'asc' },
      });
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async create(data: CreateTeacherAssignmentDTO) {
    try {
      const duplicate = await this.prisma.teacherSubjectSection.findFirst({
        where: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          sectionId: data.sectionId,
        },
      });

      if (duplicate) {
        badResponse.message = 'Ya existe una asignación para este docente, materia y sección.';
        return badResponse;
      }

      const assignment = await this.prisma.teacherSubjectSection.create({
        data: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          sectionId: data.sectionId,
          status: true,
        },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          subject: true,
          section: {
            include: { highSchoolLevel: true, schoolYear: true },
          },
        },
      });

      return { success: true, message: 'Asignación creada exitosamente', data: assignment };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async update(id: number, data: UpdateTeacherAssignmentDTO) {
    try {
      const existing = await this.prisma.teacherSubjectSection.findUnique({ where: { id } });
      if (!existing) {
        badResponse.message = 'Asignación no encontrada.';
        return badResponse;
      }

      const updated = await this.prisma.teacherSubjectSection.update({
        where: { id },
        data: {
          ...(data.teacherId !== undefined && { teacherId: data.teacherId }),
          ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
          ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
        },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          subject: true,
          section: {
            include: { highSchoolLevel: true, schoolYear: true },
          },
        },
      });

      return { success: true, message: 'Asignación actualizada exitosamente', data: updated };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async toggleStatus(id: number) {
    try {
      const existing = await this.prisma.teacherSubjectSection.findUnique({ where: { id } });
      if (!existing) {
        badResponse.message = 'Asignación no encontrada.';
        return badResponse;
      }

      const updated = await this.prisma.teacherSubjectSection.update({
        where: { id },
        data: { status: !existing.status },
      });

      const msg = updated.status ? 'Asignación activada exitosamente' : 'Asignación desactivada exitosamente';
      return { success: true, message: msg, data: updated };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
