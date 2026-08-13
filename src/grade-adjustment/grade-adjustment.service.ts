import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { CreateGradeAdjustmentDTO } from './grade-adjustment.dto';

export interface SabanaSubject {
  levelSubjectId: number;
  subjectCode: string;
  subjectName: string;
  isSpecialGroup: boolean;
  teachingGroupId: number;
}

export interface SabanaStudentSubject {
  levelSubjectId: number;
  periodGrade: number | null;
  currentAdjustment: number | null;
  adjustmentId: number | null;
  teachingGroupId: number;
}

export interface SabanaStudent {
  studentId: number;
  studentName: string;
  identification: string;
  subjects: SabanaStudentSubject[];
}

export interface SabanaSection {
  sectionId: number;
  level: string;
  section: string;
  label: string;
  studentCount: number;
  maleCount: number;
  femaleCount: number;
  sectionAverage: number | null;
  subjects: SabanaSubject[];
  students: SabanaStudent[];
}

@Injectable()
export class GradeAdjustmentService {
  constructor(private prisma: PrismaService) {}

  async getSabana(periodId: number) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
        include: { periods: true },
      });
      if (!activeSchoolYear) {
        badResponse.message = 'No hay un año escolar activo.';
        return badResponse;
      }

      const period = await this.prisma.period.findUnique({
        where: { id: periodId },
      });
      if (!period || period.schoolYearId !== activeSchoolYear.id) {
        badResponse.message = 'Período no válido para el año escolar activo.';
        return badResponse;
      }

      const sections = await this.prisma.section.findMany({
        where: { schoolYearId: activeSchoolYear.id },
        include: {
          highSchoolLevel: true,
          enrollments: {
            where: { status: true },
            include: {
              student: {
                include: { person: true },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
        include: {
          levelSubject: {
            include: {
              subject: true,
              highSchoolLevel: true,
            },
          },
          section: true,
        },
      });

      const evaluations = await this.prisma.evaluation.findMany({
        where: { periodId },
        include: { teachingGroup: true },
      });

      const evaluationsByTG = new Map<number, typeof evaluations>();
      for (const ev of evaluations) {
        const list = evaluationsByTG.get(ev.teachingGroupId) ?? [];
        list.push(ev);
        evaluationsByTG.set(ev.teachingGroupId, list);
      }

      const allEvalIds = evaluations.map((e) => e.id);
      const allStudentIds = sections.flatMap((s) =>
        s.enrollments.map((e) => e.student.id),
      );

      const gradeRecords =
        allEvalIds.length > 0 && allStudentIds.length > 0
          ? await this.prisma.gradeRecord.findMany({
              where: {
                evaluationId: { in: allEvalIds },
                studentId: { in: allStudentIds },
              },
            })
          : [];

      const gradesByStudentEval = new Map<string, number | null>();
      for (const gr of gradeRecords) {
        gradesByStudentEval.set(`${gr.studentId}-${gr.evaluationId}`, gr.score);
      }

      const existingAdjustments = await this.prisma.gradeAdjustment.findMany({
        where: {
          periodId,
          studentId: { in: allStudentIds },
        },
      });

      const adjustmentMap = new Map<
        string,
        { id: number; adjustment: number }
      >();
      for (const adj of existingAdjustments) {
        adjustmentMap.set(`${adj.studentId}-${adj.teachingGroupId}`, {
          id: adj.id,
          adjustment: adj.adjustment,
        });
      }

      const sectionsByLevelSection = new Map<
        string,
        {
          sectionId: number;
          level: string;
          section: string;
          label: string;
          studentCount: number;
          maleCount: number;
          femaleCount: number;
          subjectsMap: Map<number, SabanaSubject>;
          studentsMap: Map<number, SabanaStudent>;
        }
      >();

      for (const sec of sections) {
        const levelName = sec.highSchoolLevel.level;
        const sectionName = sec.section;
        const key = `${sec.highSchoolLevelId}-${sec.id}`;

        const subjectsMap = new Map<number, SabanaSubject>();
        const studentsMap = new Map<number, SabanaStudent>();
        let maleCount = 0;
        let femaleCount = 0;

        for (const enroll of sec.enrollments) {
          const student = enroll.student;
          const person = student.person;
          const fullName = `${person.firstNames} ${person.lastNames}`;
          if (person.gender === 'Masculino') maleCount++;
          else if (person.gender === 'Femenino') femaleCount++;
          studentsMap.set(student.id, {
            studentId: student.id,
            studentName: fullName,
            identification: person.identificationNumber,
            subjects: [],
          });
        }

        sectionsByLevelSection.set(key, {
          sectionId: sec.id,
          level: levelName,
          section: sectionName,
          label: `${levelName} ${sectionName}`,
          studentCount: sec.enrollments.length,
          maleCount,
          femaleCount,
          subjectsMap,
          studentsMap,
        });
      }

      for (const tg of teachingGroups) {
        const ls = tg.levelSubject;
        const subjectCode =
          ls.subject.code ?? ls.subject.subject.slice(0, 3).toUpperCase();
        const subjectName = ls.subject.subject;
        const isSpecialGroup = tg.isSpecialGroup;

        const key = `${tg.levelSubject.highSchoolLevelId}-${tg.sectionId ?? 0}`;
        const sectionData = sectionsByLevelSection.get(key);
        if (!sectionData) continue;

        if (!sectionData.subjectsMap.has(ls.id)) {
          sectionData.subjectsMap.set(ls.id, {
            levelSubjectId: ls.id,
            subjectCode,
            subjectName,
            isSpecialGroup,
            teachingGroupId: tg.id,
          });
        }

        const evals = evaluationsByTG.get(tg.id) ?? [];
        const totalPercentage = evals.reduce(
          (sum, e) => sum + Number(e.percentage),
          0,
        );
        if (totalPercentage === 0) continue;

        for (const student of sectionData.studentsMap.values()) {
          let weightedSum = 0;
          let hasAnyGrade = false;

          for (const ev of evals) {
            const score = gradesByStudentEval.get(`${student.studentId}-${ev.id}`);
            if (score === null || score === undefined) continue;
            weightedSum += (score * Number(ev.percentage)) / totalPercentage;
            hasAnyGrade = true;
          }

          const existingAdj = adjustmentMap.get(
            `${student.studentId}-${tg.id}`,
          );
          const rawGrade = hasAnyGrade ? Math.round(weightedSum) : null;
          const adjustedGrade = rawGrade !== null
            ? Math.min(20, rawGrade + (existingAdj?.adjustment ?? 0))
            : null;
          student.subjects.push({
            levelSubjectId: ls.id,
            periodGrade: adjustedGrade,
            currentAdjustment: existingAdj?.adjustment ?? null,
            adjustmentId: existingAdj?.id ?? null,
            teachingGroupId: tg.id,
          });
        }
      }

      const result: SabanaSection[] = [];
      for (const secData of sectionsByLevelSection.values()) {
        const subjects = Array.from(secData.subjectsMap.values());
        const students = Array.from(secData.studentsMap.values()).sort((a, b) =>
          a.studentName.localeCompare(b.studentName, 'es', {
            sensitivity: 'base',
          }),
        );

        const nonSpecialSubjects = subjects.filter((s) => !s.isSpecialGroup);
        const nonSpecialIds = new Set(
          nonSpecialSubjects.map((s) => s.levelSubjectId),
        );
        const studentAverages: number[] = [];
        for (const student of students) {
          const grades = student.subjects.filter(
            (s) =>
              nonSpecialIds.has(s.levelSubjectId) && s.periodGrade !== null,
          );
          if (grades.length > 0) {
            const avg = Math.min(20, Math.round(
              grades.reduce((sum, s) => sum + (s.periodGrade ?? 0), 0) / grades.length,
            ));
            studentAverages.push(avg);
          }
        }
        const sectionAverage =
          studentAverages.length > 0
            ? Math.min(20, Math.round(
                studentAverages.reduce((s, a) => s + a, 0) /
                  studentAverages.length,
              ))
            : null;

        result.push({
          sectionId: secData.sectionId,
          level: secData.level,
          section: secData.section,
          label: secData.label,
          studentCount: secData.studentCount,
          maleCount: secData.maleCount,
          femaleCount: secData.femaleCount,
          sectionAverage,
          subjects,
          students,
        });
      }

      return { success: true, data: { sections: result } };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getBoletinDefinitivas() {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
        include: { periods: { orderBy: { id: 'asc' } } },
      });
      if (!activeSchoolYear) {
        badResponse.message = 'No hay un año escolar activo.';
        return badResponse;
      }

      const periods = activeSchoolYear.periods;
      if (periods.length === 0) {
        badResponse.message = 'No hay períodos definidos.';
        return badResponse;
      }

      const sections = await this.prisma.section.findMany({
        where: { schoolYearId: activeSchoolYear.id },
        include: {
          highSchoolLevel: true,
          enrollments: {
            where: { status: true },
            include: { student: { include: { person: true } } },
          },
        },
        orderBy: { id: 'asc' },
      });

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: { schoolYearId: activeSchoolYear.id, status: true },
        include: {
          levelSubject: { include: { subject: true, highSchoolLevel: true } },
          section: true,
        },
      });

      const allPeriodIds = periods.map((p) => p.id);

      const allEvaluations = await this.prisma.evaluation.findMany({
        where: { periodId: { in: allPeriodIds } },
        include: { teachingGroup: true },
      });

      const evalsByTGPeriod = new Map<string, typeof allEvaluations>();
      for (const ev of allEvaluations) {
        const key = `${ev.teachingGroupId}-${ev.periodId}`;
        const list = evalsByTGPeriod.get(key) ?? [];
        list.push(ev);
        evalsByTGPeriod.set(key, list);
      }

      const allStudentIds = sections.flatMap((s) =>
        s.enrollments.map((e) => e.student.id),
      );

      const allGradeRecords =
        allStudentIds.length > 0
          ? await this.prisma.gradeRecord.findMany({
              where: {
                studentId: { in: allStudentIds },
                evaluation: { periodId: { in: allPeriodIds } },
              },
              include: { evaluation: true },
            })
          : [];

      const gradesByStudentEvalPeriod = new Map<string, number | null>();
      for (const gr of allGradeRecords) {
        const key = `${gr.studentId}-${gr.evaluationId}-${gr.evaluation.periodId}`;
        gradesByStudentEvalPeriod.set(key, gr.score);
      }

      const allAdjustments = await this.prisma.gradeAdjustment.findMany({
        where: {
          periodId: { in: allPeriodIds },
          studentId: { in: allStudentIds },
        },
      });

      const adjByStudentTGPeriod = new Map<string, { id: number; adjustment: number }>();
      for (const adj of allAdjustments) {
        const key = `${adj.studentId}-${adj.teachingGroupId}-${adj.periodId}`;
        adjByStudentTGPeriod.set(key, { id: adj.id, adjustment: adj.adjustment });
      }

      const periodGradesByStudentTG = new Map<string, number[]>();

      for (const tg of teachingGroups) {
        for (const period of periods) {
          const evals = evalsByTGPeriod.get(`${tg.id}-${period.id}`) ?? [];
          const totalPercentage = evals.reduce((sum, e) => sum + Number(e.percentage), 0);
          if (totalPercentage === 0) continue;

          for (const sec of sections) {
            if (tg.sectionId !== sec.id) continue;

            for (const enroll of sec.enrollments) {
              const studentId = enroll.student.id;
              let weightedSum = 0;
              let hasAnyGrade = false;

              for (const ev of evals) {
                const score = gradesByStudentEvalPeriod.get(`${studentId}-${ev.id}-${period.id}`);
                if (score === null || score === undefined) continue;
                weightedSum += (score * Number(ev.percentage)) / totalPercentage;
                hasAnyGrade = true;
              }

              if (hasAnyGrade) {
                const adj = adjByStudentTGPeriod.get(`${studentId}-${tg.id}-${period.id}`);
                const rawPeriodGrade = Math.round(weightedSum);
                const adjustedPeriodGrade = Math.min(20, rawPeriodGrade + (adj?.adjustment ?? 0));
                const key = `${studentId}-${tg.levelSubjectId}`;
                const list = periodGradesByStudentTG.get(key) ?? [];
                list.push(adjustedPeriodGrade);
                periodGradesByStudentTG.set(key, list);
              }
            }
          }
        }
      }

      const sectionsByLevelSection = new Map<string, {
        sectionId: number; level: string; section: string; label: string;
        studentCount: number; maleCount: number; femaleCount: number;
        subjectsMap: Map<number, SabanaSubject>;
        studentsMap: Map<number, SabanaStudent>;
      }>();

      for (const sec of sections) {
        const key = `${sec.highSchoolLevelId}-${sec.id}`;
        const subjectsMap = new Map<number, SabanaSubject>();
        const studentsMap = new Map<number, SabanaStudent>();
        let maleCount = 0;
        let femaleCount = 0;

        for (const enroll of sec.enrollments) {
          const person = enroll.student.person;
          if (person.gender === 'Masculino') maleCount++;
          else if (person.gender === 'Femenino') femaleCount++;
          studentsMap.set(enroll.student.id, {
            studentId: enroll.student.id,
            studentName: `${person.firstNames} ${person.lastNames}`,
            identification: person.identificationNumber,
            subjects: [],
          });
        }

        sectionsByLevelSection.set(key, {
          sectionId: sec.id,
          level: sec.highSchoolLevel.level,
          section: sec.section,
          label: `${sec.highSchoolLevel.level} ${sec.section}`,
          studentCount: sec.enrollments.length,
          maleCount,
          femaleCount,
          subjectsMap,
          studentsMap,
        });
      }

      for (const tg of teachingGroups) {
        const ls = tg.levelSubject;
        const subjectCode = ls.subject.code ?? ls.subject.subject.slice(0, 3).toUpperCase();
        const key = `${tg.levelSubject.highSchoolLevelId}-${tg.sectionId ?? 0}`;
        const sectionData = sectionsByLevelSection.get(key);
        if (!sectionData) continue;

        if (!sectionData.subjectsMap.has(ls.id)) {
          sectionData.subjectsMap.set(ls.id, {
            levelSubjectId: ls.id,
            subjectCode,
            subjectName: ls.subject.subject,
            isSpecialGroup: tg.isSpecialGroup,
            teachingGroupId: tg.id,
          });
        }

        for (const student of sectionData.studentsMap.values()) {
          const gradeKey = `${student.studentId}-${ls.id}`;
          const periodGrades = periodGradesByStudentTG.get(gradeKey) ?? [];
          const definitive = periodGrades.length > 0
            ? Math.min(20, Math.round(periodGrades.reduce((s, g) => s + g, 0) / periodGrades.length))
            : null;

          student.subjects.push({
            levelSubjectId: ls.id,
            periodGrade: definitive,
            currentAdjustment: null,
            adjustmentId: null,
            teachingGroupId: tg.id,
          });
        }
      }

      const result: SabanaSection[] = [];
      for (const secData of sectionsByLevelSection.values()) {
        const subjects = Array.from(secData.subjectsMap.values());
        const students = Array.from(secData.studentsMap.values()).sort((a, b) =>
          a.studentName.localeCompare(b.studentName, 'es', { sensitivity: 'base' }),
        );

        const nonSpecialIds = new Set(subjects.filter((s) => !s.isSpecialGroup).map((s) => s.levelSubjectId));
        const studentAverages: number[] = [];
        for (const student of students) {
          const grades = student.subjects.filter((s) => nonSpecialIds.has(s.levelSubjectId) && s.periodGrade !== null);
          if (grades.length > 0) {
            const avg = Math.min(20, Math.round(grades.reduce((sum, s) => sum + (s.periodGrade ?? 0), 0) / grades.length));
            studentAverages.push(avg);
          }
        }

        result.push({
          sectionId: secData.sectionId,
          level: secData.level,
          section: secData.section,
          label: secData.label,
          studentCount: secData.studentCount,
          maleCount: secData.maleCount,
          femaleCount: secData.femaleCount,
          sectionAverage: studentAverages.length > 0
            ? Math.min(20, Math.round(studentAverages.reduce((s, a) => s + a, 0) / studentAverages.length))
            : null,
          subjects,
          students,
        });
      }

      return { success: true, data: { sections: result } };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createAdjustments(data: CreateGradeAdjustmentDTO) {
    try {
      // Validate max 2 subjects per student per period
      const studentPeriodGroups = new Map<string, Set<number>>();
      for (const adj of data.adjustments) {
        const key = `${adj.studentId}-${adj.periodId}`;
        if (!studentPeriodGroups.has(key)) {
          studentPeriodGroups.set(key, new Set());
        }
        studentPeriodGroups.get(key)!.add(adj.teachingGroupId);
      }

      for (const [key, newTeachingGroupIds] of studentPeriodGroups) {
        const [studentIdStr, periodIdStr] = key.split('-');
        const studentId = Number(studentIdStr);
        const periodId = Number(periodIdStr);

        const existingCount = await this.prisma.gradeAdjustment.count({
          where: { studentId, periodId },
        });

        // Count new unique subjects not already existing
        const existingAdjustments = await this.prisma.gradeAdjustment.findMany({
          where: { studentId, periodId },
          select: { teachingGroupId: true },
        });
        const existingTGIds = new Set(
          existingAdjustments.map((a) => a.teachingGroupId),
        );
        const newUniqueCount = Array.from(newTeachingGroupIds).filter(
          (tgId) => !existingTGIds.has(tgId),
        ).length;

        if (existingCount + newUniqueCount > 2) {
          badResponse.message = `El estudiante tiene ${existingCount} materia(s) con ajuste. Máximo 2 por lapso.`;
          return badResponse;
        }
      }

      const operations = data.adjustments.map((adj) =>
        this.prisma.gradeAdjustment.upsert({
          where: {
            studentId_teachingGroupId_periodId: {
              studentId: adj.studentId,
              teachingGroupId: adj.teachingGroupId,
              periodId: adj.periodId,
            },
          },
          update: {
            adjustment: adj.adjustment,
            reason: adj.reason ?? null,
            approvedBy: adj.createdBy ?? null,
          },
          create: {
            studentId: adj.studentId,
            teachingGroupId: adj.teachingGroupId,
            periodId: adj.periodId,
            adjustment: adj.adjustment,
            reason: adj.reason ?? null,
            approvedBy: adj.createdBy ?? null,
          },
        }),
      );

      const result = await this.prisma.$transaction(operations);

      return {
        success: true,
        message: `${result.length} ajuste(s) guardado(s)`,
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
