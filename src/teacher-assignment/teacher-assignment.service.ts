import { Injectable, NotFoundException } from '@nestjs/common';
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

  //////////////////////////////////////////////////
  // OVERVIEW — levels with sections, subjects & teacher assignments
  //////////////////////////////////////////////////

  async getOverview() {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });
      if (!activeSchoolYear) {
        throw new NotFoundException('No hay un año escolar activo');
      }

      const levels = await this.prisma.highSchoolLevel.findMany({
        orderBy: { level: 'asc' },
      });

      const sections = await this.prisma.section.findMany({
        where: { schoolYearId: activeSchoolYear.id },
        include: { highSchoolLevel: true },
      });

      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          status: true,
          schoolYearId: activeSchoolYear.id,
        },
        include: {
          student: { include: { person: true } },
          section: true,
        },
      });

      const levelSubjects = await this.prisma.levelSubject.findMany({
        include: { subject: true },
      });

      const assignments = await this.prisma.teacherSubjectSection.findMany({
        where: { status: true },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
        },
      });

      const result = levels.map((level) => {
        const levelSections = sections.filter((s) => s.highSchoolLevelId === level.id);
        const levelEnrollments = enrollments.filter((e) =>
          levelSections.some((s) => s.id === e.sectionId),
        );

        const totalStudents = levelEnrollments.length;
        const maleStudents = levelEnrollments.filter(
          (e) => e.student.person.gender === 'Masculino',
        ).length;
        const femaleStudents = levelEnrollments.filter(
          (e) => e.student.person.gender === 'Femenino',
        ).length;

        const levelSubjectsForLevel = levelSubjects.filter(
          (ls) => ls.highSchoolLevelId === level.id,
        );

        const sectionsData = levelSections.map((section) => {
          const subjectsData = levelSubjectsForLevel.map((ls) => {
            const assignment = assignments.find(
              (a) => a.subjectId === ls.subjectId && a.sectionId === section.id,
            );

            return {
              subjectId: ls.subject.id,
              subject: ls.subject.subject,
              subjectCode: ls.subject.code,
              assignment: assignment
                ? {
                    id: assignment.id,
                    teacherId: assignment.teacherId,
                    teacherName: `${assignment.employee.user.person.firstNames} ${assignment.employee.user.person.lastNames}`,
                    status: assignment.status,
                  }
                : null,
            };
          });

          return {
            sectionId: section.id,
            section: section.section,
            subjects: subjectsData,
          };
        });

        return {
          highSchoolLevelId: level.id,
          level: level.level,
          totalStudents,
          maleStudents,
          femaleStudents,
          sections: sectionsData,
        };
      });

      return result;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
