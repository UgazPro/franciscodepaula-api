import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { SaveGradesDTO } from './grade.dto';

export interface GradePlanningRow {
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
  evaluationCount: number;
  loadedPercentage: number;
}

@Injectable()
export class GradeService {
  constructor(private prisma: PrismaService) {}

  async getTeacherPlanning(userId: number) {
    try {
      const employee = await this.prisma.employee.findUnique({ where: { userId } });
      if (!employee) {
        badResponse.message = 'No se encontró el perfil de empleado para este usuario.';
        return badResponse;
      }

      const activeSchoolYear = await this.prisma.schoolYear.findFirst({ where: { isActive: true } });
      if (!activeSchoolYear) {
        badResponse.message = 'No hay un año escolar activo.';
        return badResponse;
      }

      const activePeriod = await this.prisma.period.findFirst({
        where: { schoolYearId: activeSchoolYear.id },
        orderBy: { id: 'asc' },
      });

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          teacherId: employee.id,
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
        include: {
          levelSubject: { include: { subject: true, highSchoolLevel: true } },
          section: {
            include: {
              highSchoolLevel: true,
              enrollments: { where: { status: true }, include: { student: { include: { person: true } } } },
            },
          },
          studentGroups: {
            include: {
              studentEnrollment: {
                include: {
                  section: { include: { highSchoolLevel: true } },
                  student: { include: { person: true } },
                },
              },
            },
          },
          evaluations: activePeriod ? { where: { periodId: activePeriod.id } } : true,
        },
      });

      const regularAndSpecial: GradePlanningRow[] = [];
      const crpRows: GradePlanningRow[] = [];

      for (const tg of teachingGroups) {
        const isCRP = tg.isSpecialGroup && tg.sectionId === null && tg.groupName;
        const evals = tg.evaluations ?? [];
        const evaluationCount = evals.length;
        const loadedPercentage = evals.reduce((sum, e) => sum + Number(e.percentage), 0);

        let totalStudents = 0;
        let maleStudents = 0;
        let femaleStudents = 0;
        let sections = '';

        if (isCRP) {
          const validGroups = tg.studentGroups.filter(sg => sg.studentEnrollment?.status === true);
          totalStudents = validGroups.length;
          maleStudents = validGroups.filter(sg => sg.studentEnrollment?.student?.person?.gender === 'Masculino').length;
          femaleStudents = validGroups.filter(sg => sg.studentEnrollment?.student?.person?.gender === 'Femenino').length;

          const sectionSet = new Set<string>();
          for (const sg of validGroups) {
            const enrollment = sg.studentEnrollment;
            if (enrollment?.section) {
              const levelNum = enrollment.section.highSchoolLevel?.level?.match(/^(\d+)/)?.[1] ?? '';
              const sectionLetter = enrollment.section.section ?? '';
              sectionSet.add(`${levelNum}${sectionLetter}`);
            }
          }
          sections = Array.from(sectionSet).sort().join(', ');

          crpRows.push({
            teachingGroupId: tg.id, sectionId: null, section: '', level: '',
            subject: 'CRP', subjectId: tg.levelSubject.subject.id,
            levelSubjectId: tg.levelSubject.id,
            totalStudents, maleStudents, femaleStudents,
            isSpecialGroup: true, sections, groupName: tg.groupName,
            evaluationCount, loadedPercentage,
          });
        } else {
          const enrollments = tg.section?.enrollments ?? [];
          totalStudents = enrollments.length;
          maleStudents = enrollments.filter(e => e.student?.person?.gender === 'Masculino').length;
          femaleStudents = totalStudents - maleStudents;

          regularAndSpecial.push({
            teachingGroupId: tg.id, sectionId: tg.sectionId,
            section: tg.section?.section ?? '',
            level: tg.levelSubject.highSchoolLevel.level,
            subject: tg.levelSubject.subject.subject,
            subjectId: tg.levelSubject.subject.id,
            levelSubjectId: tg.levelSubject.id,
            totalStudents, maleStudents, femaleStudents,
            isSpecialGroup: tg.isSpecialGroup, sections, groupName: tg.groupName,
            evaluationCount, loadedPercentage,
          });
        }
      }

      const aggregatedCRPs = new Map<string, GradePlanningRow>();
      for (const row of crpRows) {
        const key = row.groupName!;
        if (aggregatedCRPs.has(key)) {
          const existing = aggregatedCRPs.get(key)!;
          existing.totalStudents += row.totalStudents;
          existing.maleStudents += row.maleStudents;
          existing.femaleStudents += row.femaleStudents;
          existing.evaluationCount = Math.max(existing.evaluationCount, row.evaluationCount);
          existing.loadedPercentage = Math.max(existing.loadedPercentage, row.loadedPercentage);
          const existingSections = existing.sections ? existing.sections.split(', ') : [];
          const newSections = row.sections ? row.sections.split(', ') : [];
          existing.sections = Array.from(new Set([...existingSections, ...newSections])).sort().join(', ');
        } else {
          aggregatedCRPs.set(key, { ...row });
        }
      }

      const result = [...regularAndSpecial, ...aggregatedCRPs.values()];
      return { success: true, data: result };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getGradeDetail(teachingGroupId: number, periodId?: number) {
    try {
      const tg = await this.prisma.teachingGroup.findUnique({
        where: { id: teachingGroupId },
        include: {
          section: {
            include: {
              enrollments: {
                where: { status: true },
                include: { student: { include: { person: true } } },
              },
            },
          },
          studentGroups: {
            include: {
              studentEnrollment: {
                include: {
                  student: { include: { person: true } },
                },
              },
            },
          },
        },
      });

      if (!tg) {
        badResponse.message = 'Grupo de enseñanza no encontrado.';
        return badResponse;
      }

      let students: { id: number; person: { firstNames: string; lastNames: string; identificationNumber: string } }[] = [];

      if (tg.isSpecialGroup && tg.sectionId === null) {
        const allCrpGroups = await this.prisma.teachingGroup.findMany({
          where: {
            groupName: tg.groupName,
            teacherId: tg.teacherId,
            schoolYearId: tg.schoolYearId,
            isSpecialGroup: true,
            sectionId: null,
            status: true,
          },
          include: {
            studentGroups: {
              include: {
                studentEnrollment: {
                  include: { student: { include: { person: true } } },
                },
              },
            },
          },
        });

        const studentMap = new Map<number, any>();
        for (const group of allCrpGroups) {
          const validGroups = group.studentGroups.filter(sg => sg.studentEnrollment?.status === true);
          for (const sg of validGroups) {
            const student = sg.studentEnrollment?.student;
            if (student && !studentMap.has(student.id)) {
              studentMap.set(student.id, student);
            }
          }
        }
        students = Array.from(studentMap.values()).map(s => ({
          id: s.id,
          person: { firstNames: s.person.firstNames, lastNames: s.person.lastNames, identificationNumber: s.person.identificationNumber },
        }));
      } else {
        students = (tg.section?.enrollments ?? []).map((e: any) => ({
          id: e.student.id,
          person: {
            firstNames: e.student.person.firstNames,
            lastNames: e.student.person.lastNames,
            identificationNumber: e.student.person.identificationNumber,
          },
        }));
      }

      const where: Record<string, unknown> = { teachingGroupId };
      if (periodId) where.periodId = periodId;

      const evaluations = await this.prisma.evaluation.findMany({
        where,
        include: { evaluationType: true },
        orderBy: { dueDate: 'asc' },
      });

      const evaluationIds = evaluations.map(e => e.id);

      const grades = evaluationIds.length > 0
        ? await this.prisma.gradeRecord.findMany({
            where: {
              evaluationId: { in: evaluationIds },
              studentId: { in: students.map(s => s.id) },
            },
          })
        : [];

      return {
        success: true,
        data: {
          students,
          evaluations: evaluations.map(e => ({
            id: e.id,
            topic: e.topic,
            percentage: Number(e.percentage),
            maxScore: 20,
            evaluationType: { evaluationType: e.evaluationType.evaluationType },
          })),
          grades: grades.map(g => ({
            studentId: g.studentId,
            evaluationId: g.evaluationId,
            score: g.score !== null ? Number(g.score) : null,
          })),
        },
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async saveGrades(data: SaveGradesDTO) {
    try {
      const operations = data.grades.map(g =>
        this.prisma.gradeRecord.upsert({
          where: {
            studentId_evaluationId: { studentId: g.studentId, evaluationId: g.evaluationId },
          },
          update: { score: g.score, observations: g.observations },
          create: {
            studentId: g.studentId,
            evaluationId: g.evaluationId,
            score: g.score,
            observations: g.observations,
          },
        }),
      );

      await this.prisma.$transaction(operations);

      return { success: true, message: 'Notas guardadas exitosamente' };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
