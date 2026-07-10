import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { CreateEvaluationDTO, UpdateEvaluationDTO } from './evaluation.dto';

export interface MappedGroup {
  teachingGroupId: number;
  sectionId: number | null;
  section: string;
  level: string;
  subject: string;
  subjectId: number;
  levelSubjectId: number;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  isSpecialGroup: boolean;
  sections: string;
  groupName: string | null;
}

@Injectable()
export class EvaluationService {
  constructor(private prisma: PrismaService) {}

  async getTeacherPlanning(userId: number) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { userId },
      });

      if (!employee) {
        badResponse.message = 'No se encontró el perfil de empleado para este usuario.';
        return badResponse;
      }

      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });

      if (!activeSchoolYear) {
        badResponse.message = 'No hay un año escolar activo.';
        return badResponse;
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          teacherId: employee.id,
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
        include: {
          levelSubject: {
            include: { subject: true, highSchoolLevel: true },
          },
          section: {
            include: {
              highSchoolLevel: true,
              enrollments: {
                where: { status: true },
                include: {
                  student: { include: { person: true } },
                },
              },
            },
          },
          studentGroups: {
            include: {
              studentEnrollment: {
                include: {
                  section: {
                    include: { highSchoolLevel: true },
                  },
                  student: {
                    include: { person: true },
                  },
                },
              },
            },
          },
        },
      });

      const regularAndSpecialWithSection: MappedGroup[] = [];
      const crpGroups: MappedGroup[] = [];

      for (const tg of teachingGroups) {
        const isCRP = tg.isSpecialGroup && tg.sectionId === null && tg.groupName;

        if (isCRP) {
          const validGroups = tg.studentGroups.filter(
            (sg) => sg.studentEnrollment?.status === true,
          );

          const sectionSet = new Set<string>();
          let totalStudents = 0;
          let maleStudents = 0;
          let femaleStudents = 0;

          for (const sg of validGroups) {
            totalStudents++;
            if (sg.studentEnrollment?.student?.person?.gender === 'Masculino') maleStudents++;
            if (sg.studentEnrollment?.student?.person?.gender === 'Femenino') femaleStudents++;

            const enrollment = sg.studentEnrollment;
            if (enrollment?.section) {
              const levelNum = enrollment.section.highSchoolLevel?.level?.match(/^(\d+)/)?.[1] ?? '';
              const sectionLetter = enrollment.section.section ?? '';
              sectionSet.add(`${levelNum}${sectionLetter}`);
            }
          }

          crpGroups.push({
            teachingGroupId: tg.id,
            sectionId: null,
            section: '',
            level: '',
            subject: 'CRP',
            subjectId: tg.levelSubject.subject.id,
            levelSubjectId: tg.levelSubject.id,
            totalStudents,
            maleStudents,
            femaleStudents,
            isSpecialGroup: true,
            sections: Array.from(sectionSet).sort().join(', '),
            groupName: tg.groupName,
          });
        } else {
          const enrollments = tg.section?.enrollments ?? [];
          const totalStudents = enrollments.length;
          const maleStudents = enrollments.filter(
            (e) => e.student.person.gender === 'Masculino',
          ).length;
          const femaleStudents = enrollments.filter(
            (e) => e.student.person.gender === 'Femenino',
          ).length;

          regularAndSpecialWithSection.push({
            teachingGroupId: tg.id,
            sectionId: tg.sectionId,
            section: tg.section?.section ?? '',
            level: tg.levelSubject.highSchoolLevel.level,
            subject: tg.levelSubject.subject.subject,
            subjectId: tg.levelSubject.subject.id,
            levelSubjectId: tg.levelSubject.id,
            totalStudents,
            maleStudents,
            femaleStudents,
            isSpecialGroup: tg.isSpecialGroup,
            sections: '',
            groupName: tg.groupName,
          });
        }
      }

      const aggregatedCRPs = new Map<string, MappedGroup>();
      for (const crp of crpGroups) {
        const key = crp.groupName!;
        if (aggregatedCRPs.has(key)) {
          const existing = aggregatedCRPs.get(key)!;
          existing.totalStudents += crp.totalStudents;
          existing.maleStudents += crp.maleStudents;
          existing.femaleStudents += crp.femaleStudents;
          const existingSections = existing.sections ? existing.sections.split(', ') : [];
          const newSections = crp.sections ? crp.sections.split(', ') : [];
          const merged = Array.from(new Set([...existingSections, ...newSections])).sort();
          existing.sections = merged.join(', ');
        } else {
          aggregatedCRPs.set(key, { ...crp });
        }
      }

      const result = [...regularAndSpecialWithSection, ...aggregatedCRPs.values()];

      return { success: true, data: result };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getEvaluationsByTeachingGroup(teachingGroupId: number, periodId?: number) {
    try {
      const where: Record<string, unknown> = { teachingGroupId };
      if (periodId) {
        where.periodId = periodId;
      }

      const evaluations = await this.prisma.evaluation.findMany({
        where,
        include: {
          evaluationType: true,
          period: true,
        },
        orderBy: { dueDate: 'asc' },
      });

      return { success: true, data: evaluations };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getEvaluationTypes() {
    try {
      const types = await this.prisma.evaluationType.findMany({
        orderBy: { evaluationType: 'asc' },
      });
      return { success: true, data: types };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createEvaluation(data: CreateEvaluationDTO) {
    try {
      const teachingGroup = await this.prisma.teachingGroup.findUnique({
        where: { id: data.teachingGroupId },
      });

      if (!teachingGroup) {
        badResponse.message = 'El grupo de enseñanza no existe.';
        return badResponse;
      }

      const period = await this.prisma.period.findUnique({
        where: { id: data.periodId },
      });

      if (!period) {
        badResponse.message = 'El período no existe.';
        return badResponse;
      }

      const typeName = data.evaluationType.charAt(0).toUpperCase() + data.evaluationType.slice(1).toLowerCase();

      let evaluationType = await this.prisma.evaluationType.findFirst({
        where: { evaluationType: { equals: typeName, mode: 'insensitive' } },
      });

      if (!evaluationType) {
        evaluationType = await this.prisma.evaluationType.create({
          data: { evaluationType: typeName },
        });
      }

      const evaluation = await this.prisma.evaluation.create({
        data: {
          teachingGroupId: data.teachingGroupId,
          periodId: data.periodId,
          evaluationTypeId: evaluationType.id,
          topic: data.topic,
          objectives: data.objectives,
          percentage: data.percentage,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
        include: {
          evaluationType: true,
          period: true,
        },
      });

      return {
        success: true,
        message: 'Evaluación creada exitosamente',
        data: evaluation,
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateEvaluation(id: number, data: UpdateEvaluationDTO) {
    try {
      const existing = await this.prisma.evaluation.findUnique({ where: { id } });
      if (!existing) {
        badResponse.message = 'La evaluación no existe.';
        return badResponse;
      }

      const updateData: Record<string, unknown> = {};
      if (data.topic !== undefined) updateData.topic = data.topic;
      if (data.objectives !== undefined) updateData.objectives = data.objectives;
      if (data.percentage !== undefined) updateData.percentage = data.percentage;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

      if (data.evaluationType !== undefined) {
        const typeName = data.evaluationType.charAt(0).toUpperCase() + data.evaluationType.slice(1).toLowerCase();
        let evaluationType = await this.prisma.evaluationType.findFirst({
          where: { evaluationType: { equals: typeName, mode: 'insensitive' } },
        });
        if (!evaluationType) {
          evaluationType = await this.prisma.evaluationType.create({
            data: { evaluationType: typeName },
          });
        }
        updateData.evaluationTypeId = evaluationType.id;
      }

      const evaluation = await this.prisma.evaluation.update({
        where: { id },
        data: updateData,
        include: { evaluationType: true, period: true },
      });

      return {
        success: true,
        message: 'Evaluación actualizada exitosamente',
        data: evaluation,
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async deleteEvaluation(id: number) {
    try {
      const existing = await this.prisma.evaluation.findUnique({
        where: { id },
        include: { grades: true },
      });

      if (!existing) {
        badResponse.message = 'La evaluación no existe.';
        return badResponse;
      }

      if (existing.grades.length > 0) {
        badResponse.message = 'No se puede eliminar: esta evaluación tiene notas asociadas.';
        return badResponse;
      }

      await this.prisma.evaluation.delete({ where: { id } });

      return {
        success: true,
        message: 'Evaluación eliminada exitosamente',
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
