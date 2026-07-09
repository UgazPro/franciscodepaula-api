import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import {
  CreateTeacherAssignmentDTO,
  UpdateTeacherAssignmentDTO,
  CreateSpecialGroupDTO,
  UpdateSpecialGroupDTO,
} from './teacher-assignment.dto';
import { badResponse } from '@/utilities/base.dto';

interface SpecialGroupWithMeta
  extends Prisma.TeachingGroupGetPayload<{
    include: {
      employee: { include: { user: { include: { person: true } } } };
      levelSubject: { include: { subject: true; highSchoolLevel: true } };
      schoolYear: true;
      _count: { select: { studentGroups: true } };
    };
  }> {
  totalLevels: number;
  totalStudents: number;
}

@Injectable()
export class TeacherAssignmentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.teachingGroup.findMany({
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          section: {
            include: { highSchoolLevel: true, schoolYear: true },
          },
          schoolYear: true,
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
      const duplicate = await this.prisma.teachingGroup.findFirst({
        where: {
          teacherId: data.teacherId,
          levelSubjectId: data.levelSubjectId,
          schoolYearId: data.schoolYearId,
          ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
        },
      });

      if (duplicate) {
        badResponse.message =
          'Ya existe una asignación para este docente, materia y sección.';
        return badResponse;
      }

      const assignment = await this.prisma.teachingGroup.create({
        data: {
          teacherId: data.teacherId,
          levelSubjectId: data.levelSubjectId,
          schoolYearId: data.schoolYearId,
          sectionId: data.sectionId,
          status: true,
        },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          section: {
            include: { highSchoolLevel: true, schoolYear: true },
          },
          schoolYear: true,
        },
      });

      return {
        success: true,
        message: 'Asignación creada exitosamente',
        data: assignment,
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async update(id: number, data: UpdateTeacherAssignmentDTO) {
    try {
      const existing = await this.prisma.teachingGroup.findUnique({
        where: { id },
      });
      if (!existing) {
        badResponse.message = 'Asignación no encontrada.';
        return badResponse;
      }

      const updated = await this.prisma.teachingGroup.update({
        where: { id },
        data: {
          ...(data.teacherId !== undefined && { teacherId: data.teacherId }),
          ...(data.levelSubjectId !== undefined && {
            levelSubjectId: data.levelSubjectId,
          }),
          ...(data.schoolYearId !== undefined && {
            schoolYearId: data.schoolYearId,
          }),
          ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
        },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          section: {
            include: { highSchoolLevel: true, schoolYear: true },
          },
          schoolYear: true,
        },
      });

      return {
        success: true,
        message: 'Asignación actualizada exitosamente',
        data: updated,
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async toggleStatus(id: number) {
    try {
      const existing = await this.prisma.teachingGroup.findUnique({
        where: { id },
      });
      if (!existing) {
        badResponse.message = 'Asignación no encontrada.';
        return badResponse;
      }

      const updated = await this.prisma.teachingGroup.update({
        where: { id },
        data: { status: !existing.status },
      });

      const msg = updated.status
        ? 'Asignación activada exitosamente'
        : 'Asignación desactivada exitosamente';
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
        return [];
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

      const assignments = await this.prisma.teachingGroup.findMany({
        where: { status: true, schoolYearId: activeSchoolYear.id },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
        },
      });

      const result = levels.map((level) => {
        const levelSections = sections.filter(
          (s) => s.highSchoolLevelId === level.id,
        );
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
          (ls) => ls.highSchoolLevelId === level.id && ls.subject.code !== 'CRP',
        );

        const sectionsData = levelSections.map((section) => {
          const sectionEnrollments = enrollments.filter(
            (e) => e.sectionId === section.id,
          );
          const sectionTotal = sectionEnrollments.length;
          const sectionMale = sectionEnrollments.filter(
            (e) => e.student.person.gender === 'Masculino',
          ).length;
          const sectionFemale = sectionEnrollments.filter(
            (e) => e.student.person.gender === 'Femenino',
          ).length;

          const subjectsData = levelSubjectsForLevel.map((ls) => {
            const assignment = assignments.find(
              (a) => a.levelSubjectId === ls.id && a.sectionId === section.id,
            );

            return {
              levelSubjectId: ls.id,
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
            totalStudents: sectionTotal,
            maleStudents: sectionMale,
            femaleStudents: sectionFemale,
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
      return [];
    }
  }

  //////////////////////////////////////////////////
  // SPECIAL GROUPS — CRPs
  //////////////////////////////////////////////////

  async findSpecialGroups() {
    try {
      const groups = await this.prisma.teachingGroup.findMany({
        where: { isSpecialGroup: true, sectionId: null },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          schoolYear: true,
          _count: { select: { studentGroups: true } },
        },
        orderBy: { groupName: 'asc' },
      });

      // Group by groupName and take the first record for each unique CRP
      const seen = new Map<string, SpecialGroupWithMeta>();
      for (const group of groups) {
        const name = group.groupName ?? 'unknown';
        if (!seen.has(name)) {
          const sameNameGroups = groups.filter(g => (g.groupName ?? 'unknown') === name);
          seen.set(name, {
            ...group,
            totalLevels: sameNameGroups.length,
            totalStudents: sameNameGroups.reduce((sum, g) => sum + g._count.studentGroups, 0),
          });
        }
      }

      return { success: true, message: 'OK', data: Array.from(seen.values()) };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async findSpecialGroupByName(groupName: string) {
    try {
      const groups = await this.prisma.teachingGroup.findMany({
        where: { isSpecialGroup: true, groupName },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          schoolYear: true,
        },
        orderBy: { groupName: 'asc' },
      });
      return { success: true, message: 'OK', data: groups };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createSpecialGroup(data: CreateSpecialGroupDTO) {
    try {
      const existing = await this.prisma.teachingGroup.findFirst({
        where: {
          groupName: data.groupName,
          schoolYearId: data.schoolYearId,
          isSpecialGroup: true,
        },
      });
      if (existing) {
        return { success: false, message: 'Ya existe un grupo especial con ese nombre', data: null };
      }

      const group = await this.prisma.teachingGroup.create({
        data: {
          teacherId: data.teacherId,
          levelSubjectId: data.levelSubjectId,
          schoolYearId: data.schoolYearId,
          groupName: data.groupName,
          isSpecialGroup: true,
          status: true,
        },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          schoolYear: true,
        },
      });
      return { success: true, message: 'Grupo especial creado', data: group };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateSpecialGroup(id: number, data: UpdateSpecialGroupDTO) {
    try {
      const existing = await this.prisma.teachingGroup.findUnique({ where: { id } });
      if (!existing || !existing.isSpecialGroup) {
        return { success: false, message: 'Grupo especial no encontrado', data: null };
      }

      const group = await this.prisma.teachingGroup.update({
        where: { id },
        data: {
          ...(data.teacherId !== undefined && { teacherId: data.teacherId }),
          ...(data.levelSubjectId !== undefined && { levelSubjectId: data.levelSubjectId }),
          ...(data.schoolYearId !== undefined && { schoolYearId: data.schoolYearId }),
          ...(data.groupName !== undefined && { groupName: data.groupName }),
        },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          schoolYear: true,
        },
      });
      return { success: true, message: 'Grupo especial actualizado', data: group };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async toggleSpecialGroupStatus(id: number) {
    try {
      const existing = await this.prisma.teachingGroup.findUnique({ where: { id } });
      if (!existing || !existing.isSpecialGroup) {
        return { success: false, message: 'Grupo especial no encontrado', data: null };
      }

      const group = await this.prisma.teachingGroup.update({
        where: { id },
        data: { status: !existing.status },
        include: {
          employee: {
            include: { user: { include: { person: true } } },
          },
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          schoolYear: true,
        },
      });
      const msg = group.status
        ? 'Grupo especial activado exitosamente'
        : 'Grupo especial desactivado exitosamente';
      return { success: true, message: msg, data: group };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CRP STUDENT MANAGEMENT
  //////////////////////////////////////////////////

  async getSpecialGroupStudents(groupName: string) {
    try {
      // Find all teaching groups with this groupName
      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: { isSpecialGroup: true, groupName },
        select: { id: true },
      });

      const teachingGroupIds = teachingGroups.map(tg => tg.id);

      const students = await this.prisma.studentTeachingGroup.findMany({
        where: { teachingGroupId: { in: teachingGroupIds } },
        include: {
          studentEnrollment: {
            include: {
              student: { include: { person: true } },
              section: { include: { highSchoolLevel: true } },
            },
          },
          teachingGroup: {
            include: {
              levelSubject: { include: { highSchoolLevel: true } },
            },
          },
        },
      });

      return { success: true, message: 'OK', data: students };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async addStudentsToSpecialGroup(groupName: string, studentEnrollmentIds: number[]) {
    try {
      // Find all teaching groups with this groupName
      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: { isSpecialGroup: true, groupName },
        select: { id: true, levelSubject: { select: { highSchoolLevelId: true } } },
      });

      const dataToInsert: { studentEnrollmentId: number; teachingGroupId: number }[] = [];

      for (const enrollmentId of studentEnrollmentIds) {
        // Get the enrollment to find its level
        const enrollment = await this.prisma.studentEnrollment.findUnique({
          where: { id: enrollmentId },
          include: { section: true },
        });

        if (!enrollment) continue;

        // Find the matching teaching group for this enrollment's level
        const matchingGroup = teachingGroups.find(
          tg => tg.levelSubject.highSchoolLevelId === enrollment.section.highSchoolLevelId
        );

        if (matchingGroup) {
          // Check if already exists
          const existing = await this.prisma.studentTeachingGroup.findFirst({
            where: {
              studentEnrollmentId: enrollmentId,
              teachingGroupId: matchingGroup.id,
            },
          });

          if (!existing) {
            dataToInsert.push({
              studentEnrollmentId: enrollmentId,
              teachingGroupId: matchingGroup.id,
            });
          }
        }
      }

      if (dataToInsert.length > 0) {
        await this.prisma.studentTeachingGroup.createMany({ data: dataToInsert });
      }

      return { success: true, message: `${dataToInsert.length} estudiante(s) asignado(s)`, data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async removeStudentFromSpecialGroup(groupName: string, studentEnrollmentId: number) {
    try {
      // Find all teaching groups with this groupName
      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: { isSpecialGroup: true, groupName },
        select: { id: true },
      });

      const teachingGroupIds = teachingGroups.map(tg => tg.id);

      await this.prisma.studentTeachingGroup.deleteMany({
        where: {
          studentEnrollmentId,
          teachingGroupId: { in: teachingGroupIds },
        },
      });

      return { success: true, message: 'Estudiante removido del CRP', data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getAvailableStudentsForCRP() {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });

      if (!activeSchoolYear) {
        return { success: false, message: 'No hay año escolar activo', data: [] };
      }

      // Get all active enrollments for the active school year
      const allEnrollments = await this.prisma.studentEnrollment.findMany({
        where: { status: true, schoolYearId: activeSchoolYear.id },
        include: {
          student: { include: { person: true } },
          section: { include: { highSchoolLevel: true } },
        },
      });

      // Get enrollments that already have a CRP
      const enrollmentsWithCRP = await this.prisma.studentTeachingGroup.findMany({
        where: { teachingGroup: { isSpecialGroup: true, sectionId: null } },
        select: { studentEnrollmentId: true },
      });

      const idsWithCRP = new Set(enrollmentsWithCRP.map(e => e.studentEnrollmentId));
      const available = allEnrollments.filter(e => !idsWithCRP.has(e.id));

      return { success: true, message: 'OK', data: available };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
