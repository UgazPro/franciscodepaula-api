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

      const evaluationIds = teachingGroups.flatMap(tg => (tg.evaluations ?? []).map(e => e.id));
      const gradeCountsByEval: Record<number, number> = {};
      if (evaluationIds.length > 0) {
        const gradeRows = await this.prisma.gradeRecord.groupBy({
          by: ['evaluationId'],
          where: { evaluationId: { in: evaluationIds } },
          _count: { id: true },
        });
        for (const row of gradeRows) {
          gradeCountsByEval[row.evaluationId] = row._count.id;
        }
      }

      // Collect all student IDs and levelSubjectIds to batch-query approved subjects
      const allStudentIds = new Set<number>();
      const allLevelSubjectIds = new Set<number>();
      for (const tg of teachingGroups) {
        if (tg.sectionId !== null) {
          const enrollments = tg.section?.enrollments ?? [];
          for (const e of enrollments) allStudentIds.add(e.student.id);
        } else {
          const validGroups = tg.studentGroups.filter(sg => sg.studentEnrollment?.status === true);
          for (const sg of validGroups) {
            const enrollment = sg.studentEnrollment;
            if (enrollment?.studentId) allStudentIds.add(enrollment.studentId);
          }
        }
        allLevelSubjectIds.add(tg.levelSubjectId);
      }

      const approvedHistoryRecords = allStudentIds.size > 0
        ? await this.prisma.schoolStudentHistory.findMany({
            where: {
              studentId: { in: Array.from(allStudentIds) },
              levelSubjectId: { in: Array.from(allLevelSubjectIds) },
              typeOf: 'F',
            },
            select: { studentId: true, levelSubjectId: true },
          })
        : [];

      const approvedMap = new Map<number, Set<number>>();
      for (const r of approvedHistoryRecords) {
        if (r.levelSubjectId == null) continue;
        if (!approvedMap.has(r.studentId)) approvedMap.set(r.studentId, new Set());
        approvedMap.get(r.studentId)!.add(r.levelSubjectId);
      }

      const regularAndSpecial: GradePlanningRow[] = [];
      const crpRows: GradePlanningRow[] = [];

      for (const tg of teachingGroups) {
        const isCRP = tg.isSpecialGroup && tg.sectionId === null && tg.groupName;
        const evals = tg.evaluations ?? [];
        const evaluationCount = evals.length;
        const loadedGrades = evals.reduce((sum, e) => sum + (gradeCountsByEval[e.id] ?? 0), 0);

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

          const approvedStudents = validGroups.filter(sg => {
            const enrollment = sg.studentEnrollment;
            return enrollment?.studentId && approvedMap.get(enrollment.studentId)?.has(tg.levelSubjectId);
          }).length;
          const effectiveSlots = (totalStudents - approvedStudents) * evaluationCount;
          const loadedPercentage = effectiveSlots > 0 ? (loadedGrades / effectiveSlots) * 100 : (totalStudents > 0 ? 100 : 0);

          crpRows.push({
            teachingGroupId: tg.id, sectionId: null, section: '', level: '',
            subject: 'CRP', subjectId: tg.levelSubject.subject.id,
            levelSubjectId: tg.levelSubject.id,
            totalStudents, maleStudents, femaleStudents,
            isSpecialGroup: true, sections, groupName: tg.groupName,
            evaluationCount, loadedPercentage,
            _effectiveSlots: effectiveSlots,
          } as GradePlanningRow & { _effectiveSlots: number });
        } else {
          const enrollments = tg.section?.enrollments ?? [];
          totalStudents = enrollments.length;
          maleStudents = enrollments.filter(e => e.student?.person?.gender === 'Masculino').length;
          femaleStudents = totalStudents - maleStudents;

          const approvedStudents = enrollments.filter(e =>
            approvedMap.get(e.student?.id)?.has(tg.levelSubjectId)
          ).length;
          const effectiveSlots = (totalStudents - approvedStudents) * evaluationCount;
          const loadedPercentage = effectiveSlots > 0 ? (loadedGrades / effectiveSlots) * 100 : (totalStudents > 0 ? 100 : 0);

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

      const aggregatedCRPs = new Map<string, GradePlanningRow & { _loadedGrades: number; _totalSlots: number }>();
      for (const row of crpRows) {
        const key = row.groupName!;
        const effectiveSlots = (row as any)._effectiveSlots ?? row.totalStudents * row.evaluationCount;
        const rowLoadedGrades = Math.round((row.loadedPercentage / 100) * effectiveSlots);

        if (aggregatedCRPs.has(key)) {
          const existing = aggregatedCRPs.get(key)!;
          existing.totalStudents += row.totalStudents;
          existing.maleStudents += row.maleStudents;
          existing.femaleStudents += row.femaleStudents;
          existing.evaluationCount = Math.max(existing.evaluationCount, row.evaluationCount);
          existing._loadedGrades += rowLoadedGrades;
          existing._totalSlots += effectiveSlots;
          existing.loadedPercentage = existing._totalSlots > 0 ? (existing._loadedGrades / existing._totalSlots) * 100 : 0;
          const existingSections = existing.sections ? existing.sections.split(', ') : [];
          const newSections = row.sections ? row.sections.split(', ') : [];
          existing.sections = Array.from(new Set([...existingSections, ...newSections])).sort().join(', ');
        } else {
          aggregatedCRPs.set(key, { ...row, _loadedGrades: rowLoadedGrades, _totalSlots: effectiveSlots });
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
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
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

      // Check for approved subjects in schoolStudentHistory for each student
      const studentIds = students.map(s => s.id);
      const levelSubjectId = tg.levelSubjectId;

      const approvedHistoryRecords = studentIds.length > 0
        ? await this.prisma.schoolStudentHistory.findMany({
            where: {
              studentId: { in: studentIds },
              levelSubjectId,
              typeOf: 'F',
            },
            select: { studentId: true, finalScore: true },
          })
        : [];

      const approvedScoreMap = new Map(
        approvedHistoryRecords.map(r => [r.studentId, r.finalScore != null ? Number(r.finalScore) : null])
      );

      const enrichedStudents = students.map(s => ({
        ...s,
        hasApprovedSubject: approvedScoreMap.has(s.id),
        approvedSubjectScore: approvedScoreMap.get(s.id) ?? null,
      }));

      return {
        success: true,
        data: {
          students: enrichedStudents,
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

  async getTeachersOverview(periodId?: number) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({ where: { isActive: true } });
      if (!activeSchoolYear) {
        return { success: false, message: 'No hay un año escolar activo.' };
      }

      let targetPeriodId = periodId;
      if (!targetPeriodId) {
        const activePeriod = await this.prisma.period.findFirst({
          where: { schoolYearId: activeSchoolYear.id },
          orderBy: { id: 'asc' },
        });
        targetPeriodId = activePeriod?.id;
      }

      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: {
          schoolYearId: activeSchoolYear.id,
          status: true,
        },
        include: {
          employee: { include: { user: { include: { person: true } } } },
          levelSubject: { include: { subject: true, highSchoolLevel: true } },
          section: { include: { highSchoolLevel: true } },
          evaluations: targetPeriodId ? { where: { periodId: targetPeriodId } } : true,
        },
      });

      const evaluationIds = teachingGroups.flatMap(tg => (tg.evaluations ?? []).map(e => e.id));
      const gradeCountsByEval: Record<number, number> = {};
      if (evaluationIds.length > 0) {
        const gradeRows = await this.prisma.gradeRecord.groupBy({
          by: ['evaluationId'],
          where: { evaluationId: { in: evaluationIds } },
          _count: { id: true },
        });
        for (const row of gradeRows) {
          gradeCountsByEval[row.evaluationId] = row._count.id;
        }
      }

      const teacherMap = new Map<number, {
        teacherId: number;
        teacherName: string;
        teacherPhoto: string | null;
        identificationNumber: string;
        loadedCount: number;
        totalCount: number;
        groups: {
          teachingGroupId: number;
          level: string;
          section: string;
          subject: string;
          evaluationCount: number;
          totalPercentage: number;
          loadedPercentage: number;
          isLoaded: boolean;
        }[];
        _crpGroups: {
          teachingGroupId: number;
          evaluationCount: number;
          totalPercentage: number;
          studentCount: number;
          loadedGrades: number;
        }[];
      }>();

      for (const tg of teachingGroups) {
        const emp = tg.employee;
        if (!emp?.user?.person) continue;

        const teacherId = emp.id;
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            teacherId,
            teacherName: `${emp.user.person.firstNames} ${emp.user.person.lastNames}`,
            teacherPhoto: emp.user.person.profilePhoto ?? null,
            identificationNumber: emp.user.person.identificationNumber,
            loadedCount: 0,
            totalCount: 0,
            groups: [],
            _crpGroups: [],
          });
        }

        const evals = tg.evaluations ?? [];
        const evaluationCount = evals.length;
        const totalPercentage = evals.reduce((sum, e) => sum + Number(e.percentage), 0);
        const loadedGrades = evals.reduce((sum, e) => sum + (gradeCountsByEval[e.id] ?? 0), 0);

        let studentCount = 0;
        if (tg.isSpecialGroup && tg.sectionId === null) {
          const studentGroups = await this.prisma.studentTeachingGroup.findMany({
            where: { teachingGroupId: tg.id, studentEnrollment: { status: true } },
          });
          studentCount = studentGroups.length;
        } else {
          studentCount = tg.section
            ? await this.prisma.studentEnrollment.count({
                where: { sectionId: tg.sectionId!, status: true },
              })
            : 0;
        }

        const teacher = teacherMap.get(teacherId)!;

        if (tg.isSpecialGroup && tg.sectionId === null) {
          teacher._crpGroups.push({
            teachingGroupId: tg.id,
            evaluationCount,
            totalPercentage,
            studentCount,
            loadedGrades,
          });
        } else {
          const totalGradeSlots = studentCount * evaluationCount;
          const loadedPercentage = totalGradeSlots > 0 ? (loadedGrades / totalGradeSlots) * 100 : 0;
          const isLoaded = loadedPercentage >= 70;

          teacher.groups.push({
            teachingGroupId: tg.id,
            level: tg.levelSubject?.highSchoolLevel?.level ?? '',
            section: tg.section?.section ?? '',
            subject: tg.levelSubject?.subject?.subject ?? '',
            evaluationCount,
            totalPercentage,
            loadedPercentage,
            isLoaded,
          });
        }
      }

      for (const teacher of teacherMap.values()) {
        if (teacher._crpGroups.length > 0) {
          const totalEvalCount = Math.max(...teacher._crpGroups.map(c => c.evaluationCount));
          const totalPct = Math.max(...teacher._crpGroups.map(c => c.totalPercentage));
          const totalStudentSlots = teacher._crpGroups.reduce((sum, c) => sum + c.studentCount * c.evaluationCount, 0);
          const totalLoaded = teacher._crpGroups.reduce((sum, c) => sum + c.loadedGrades, 0);
          const loadedPct = totalStudentSlots > 0 ? (totalLoaded / totalStudentSlots) * 100 : 0;
          const isLoaded = loadedPct >= 70;

          teacher.groups.unshift({
            teachingGroupId: teacher._crpGroups[0].teachingGroupId,
            level: '',
            section: '',
            subject: 'CRP',
            evaluationCount: totalEvalCount,
            totalPercentage: totalPct,
            loadedPercentage: loadedPct,
            isLoaded,
          });
        }
        teacher.totalCount = teacher.groups.length;
        teacher.loadedCount = teacher.groups.filter(g => g.isLoaded).length;
      }

      const result = Array.from(teacherMap.values()).map(({ _crpGroups, ...rest }) => rest);
      return { success: true, data: result };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
