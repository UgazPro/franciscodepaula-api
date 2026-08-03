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

        let weightedSum = 0;
        let hasAnyGrade = false;
        for (const ev of evals) {
          for (const [studentKey, score] of gradesByStudentEval.entries()) {
            if (score === null) continue;
            const studentIdStr = studentKey.split('-')[0];
            const studentId = Number(studentIdStr);
            if (
              ev.id === Number(studentKey.split('-')[1]) &&
              sectionData.studentsMap.has(studentId)
            ) {
              weightedSum += (score * Number(ev.percentage)) / totalPercentage;
              hasAnyGrade = true;
            }
          }
        }

        for (const student of sectionData.studentsMap.values()) {
          const existingAdj = adjustmentMap.get(
            `${student.studentId}-${tg.id}`,
          );
          student.subjects.push({
            levelSubjectId: ls.id,
            periodGrade: hasAnyGrade ? Math.round(weightedSum) : null,
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
            const avg = Math.round(
              grades.reduce(
                (sum, s) =>
                  sum + ((s.periodGrade ?? 0) + (s.currentAdjustment ?? 0)),
                0,
              ) / grades.length,
            );
            studentAverages.push(avg);
          }
        }
        const sectionAverage =
          studentAverages.length > 0
            ? Math.round(
                studentAverages.reduce((s, a) => s + a, 0) /
                  studentAverages.length,
              )
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
