import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSchoolHistoryDTO, CreateFailedSubjectDTO, CreateSchoolHistoryBatchDTO, UpdateSchoolHistoryDTO, UpdateSchoolHistoryBatchDTO } from './academic-history.dto';

@Injectable()
export class AcademicHistoryService {
  constructor(private prisma: PrismaService) {}

  async getAcademicHistory(studentId: number) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          person: { select: { firstNames: true, lastNames: true } },
          studentHistories: {
            select: {
              id: true,
              schoolYear: true,
              levelSubjectId: true,
              schoolId: true,
              finalScore: true,
              levelSubject: {
                include: {
                  highSchoolLevel: { select: { id: true, level: true } },
                  subject: { select: { subject: true, code: true } },
                },
              },
              school: { select: { id: true, schoolName: true } },
            },
            orderBy: { schoolYear: 'asc' },
          },
          enrollments: {
            where: { status: true },
            include: {
              schoolYear: { select: { id: true, name: true } },
              section: {
                include: {
                  highSchoolLevel: { select: { id: true, level: true } },
                },
              },
              studentTeachingGroups: {
                include: {
                  teachingGroup: {
                    include: {
                      levelSubject: {
                        include: {
                          subject: { select: { subject: true } },
                        },
                      },
                      evaluations: {
                        include: {
                          grades: {
                            where: { studentId },
                            select: { score: true },
                          },
                          period: { select: { id: true, period: true } },
                          evaluationType: { select: { evaluationType: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { schoolYearId: 'asc' },
          },
          failedSubjects: {
            include: {
              levelSubject: {
                include: {
                  subject: { select: { subject: true } },
                  highSchoolLevel: { select: { level: true } },
                },
              },
            },
          },
        },
      });

      if (!student) {
        throw new BadRequestException('Estudiante no encontrado');
      }

      const currentSchool = await this.prisma.school.findUnique({
        where: { id: 1 },
        select: { id: true, schoolName: true },
      });

      // Helper to extract level order from level name (e.g., "1er Año" → 1)
      function getLevelOrder(level: string | null): number {
        if (!level) return 99;
        const match = level.match(/(\d)/);
        return match ? parseInt(match[1]) : 99;
      }

      // Build history entries from enrollments (current school)
      const enrollmentHistory = student.enrollments.map((enrollment) => {
        const teachingGroups = enrollment.studentTeachingGroups.map((stg) => {
          const tg = stg.teachingGroup;
          const subjectName = tg.levelSubject.subject.subject;
          const evaluations = tg.evaluations;

          // Compute weighted average for this subject
          let totalWeightedScore = 0;
          let totalPercentage = 0;
          const grades: {
            evaluationId: number;
            topic: string;
            percentage: number;
            evaluationType: string;
            period: string;
            score: number | null;
          }[] = [];

          // Compute per-period averages
          const periodMap = new Map<string, { totalWeighted: number; totalPct: number }>();
          for (const ev of evaluations) {
            const grade = ev.grades[0];
            const score = grade?.score != null ? Number(grade.score) : null;
            const percentage = Number(ev.percentage);
            const periodName = ev.period.period;

            grades.push({
              evaluationId: ev.id,
              topic: ev.topic,
              percentage,
              evaluationType: ev.evaluationType.evaluationType,
              period: periodName,
              score,
            });

            if (score != null) {
              totalWeightedScore += (score / 20) * percentage;
              totalPercentage += percentage;

              if (!periodMap.has(periodName)) {
                periodMap.set(periodName, { totalWeighted: 0, totalPct: 0 });
              }
              const p = periodMap.get(periodName)!;
              p.totalWeighted += (score / 20) * percentage;
              p.totalPct += percentage;
            }
          }

          const definitiva =
            totalPercentage > 0
              ? Math.round((totalWeightedScore / totalPercentage) * 20 * 10) / 10
              : null;

          const periodAverages = Array.from(periodMap.entries()).map(([period, data]) => ({
            period,
            average: data.totalPct > 0 ? Math.round((data.totalWeighted / data.totalPct) * 20 * 10) / 10 : null,
          }));

          return {
            subjectName,
            isSpecialGroup: tg.isSpecialGroup,
            definitiva,
            totalEvaluations: evaluations.length,
            gradedEvaluations: grades.filter((g) => g.score != null).length,
            grades,
            periodAverages,
          };
        });

        // Overall average across regular subjects (exclude isSpecialGroup like CRP)
        const regularSubjects = teachingGroups.filter((t) => !t.isSpecialGroup);
        const subjectsWithAvg = regularSubjects.filter((t) => t.definitiva != null);
        const overallAverage =
          subjectsWithAvg.length > 0
            ? Math.round(
                (subjectsWithAvg.reduce((sum, t) => sum + (t.definitiva ?? 0), 0) /
                  subjectsWithAvg.length) *
                  10,
              ) / 10
            : null;

        // Failed subjects for this level
        const levelId = enrollment.section.highSchoolLevel.id;
        const failed = student.failedSubjects
          .filter((fs) => fs.levelSubject.highSchoolLevelId === levelId)
          .map((fs) => ({
            subjectName: fs.levelSubject.subject.subject,
            finalAverage: fs.finalAverage != null ? Number(fs.finalAverage) : null,
            typeOf: fs.typeOf,
            status: fs.status,
            observations: fs.observations,
            date: fs.date,
          }));

        return {
          schoolYearId: enrollment.schoolYear.id,
          schoolYearName: enrollment.schoolYear.name,
          level: enrollment.section.highSchoolLevel.level,
          section: enrollment.section.section,
          schoolName: currentSchool?.schoolName ?? 'Escuela Actual',
          schoolId: currentSchool?.id ?? 1,
          averageGrade: overallAverage,
          totalSubjects: regularSubjects.length,
          totalGrades: regularSubjects.reduce((sum, t) => sum + t.totalEvaluations, 0),
          subjects: teachingGroups,
          failedSubjects: failed,
          _levelOrder: getLevelOrder(enrollment.section.highSchoolLevel.level),
        };
      });

      // Build history entries from SchoolStudentHistory (previous schools)
      // Group by level (highSchoolLevelId)
      const historyByLevel = new Map<number, typeof student.studentHistories>();
      for (const sh of student.studentHistories) {
        const levelId = sh.levelSubject?.highSchoolLevelId;
        if (levelId == null) continue; // Skip records without levelSubject
        if (!historyByLevel.has(levelId)) {
          historyByLevel.set(levelId, []);
        }
        historyByLevel.get(levelId)!.push(sh);
      }

      const specialSubjectCodes = ['CRP', 'ROB', 'MUS', 'OV', 'MET'];

      const previousHistory = Array.from(historyByLevel.entries()).map(([levelId, records]) => {
        const subjects = records
          .filter((sh) => sh.levelSubject != null && sh.finalScore != null)
          .map((sh) => ({
            subjectName: sh.levelSubject!.subject?.subject ?? 'Materia Desconocida',
            isSpecialGroup: specialSubjectCodes.includes(sh.levelSubject!.subject?.code ?? ''),
            definitiva: sh.finalScore != null ? Number(sh.finalScore) : null,
            totalEvaluations: 0,
            gradedEvaluations: 0,
            grades: [] as {
              evaluationId: number;
              topic: string;
              percentage: number;
              evaluationType: string;
              period: string;
              score: number | null;
            }[],
            periodAverages: [] as { period: string; average: number | null }[],
          }));

        const regularSubjects = subjects.filter((s) => !s.isSpecialGroup);
        const subjectsWithAvg = regularSubjects.filter((s) => s.definitiva != null);
        const overallAverage =
          subjectsWithAvg.length > 0
            ? Math.round(
                (subjectsWithAvg.reduce((sum, s) => sum + (s.definitiva ?? 0), 0) /
                  subjectsWithAvg.length) *
                  10,
              ) / 10
            : null;

        const levelName = records[0]?.levelSubject?.highSchoolLevel?.level ?? null;
        const school = records[0]?.school;
        const schoolYear = records[0]?.schoolYear ?? null;

        return {
          schoolYearId: null,
          schoolYearName: null,
          schoolYear,
          level: levelName,
          section: null,
          schoolName: school?.schoolName ?? 'Escuela Anterior',
          schoolId: school?.id ?? null,
          averageGrade: overallAverage,
          totalSubjects: regularSubjects.length,
          totalGrades: 0,
          subjects,
          failedSubjects: [],
          records: records.map((r) => ({
            id: r.id,
            levelSubjectId: r.levelSubjectId,
            schoolId: r.schoolId,
            schoolYear: r.schoolYear,
            finalScore: r.finalScore != null ? Number(r.finalScore) : null,
            subjectName: r.levelSubject?.subject?.subject ?? 'Desconocida',
          })),
          _levelOrder: getLevelOrder(levelName),
        };
      });

      // Combine and sort by level order
      const allHistory = [...enrollmentHistory, ...previousHistory].sort(
        (a, b) => a._levelOrder - b._levelOrder,
      );

      return {
        studentId,
        studentName: `${student.person.firstNames} ${student.person.lastNames}`,
        currentSchool,
        history: allHistory,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(String(error));
    }
  }

  async addSchoolHistory(data: CreateSchoolHistoryDTO) {
    try {
      const record = await this.prisma.schoolStudentHistory.create({
        data: {
          studentId: data.studentId,
          levelSubjectId: data.levelSubjectId,
          schoolId: data.schoolId,
          schoolYear: data.schoolYear ?? null,
          finalScore: data.finalScore ?? null,
        },
      });
      return { success: true, message: 'Historial escolar agregado', data: record };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }

  async addSchoolHistoryBatch(data: CreateSchoolHistoryBatchDTO) {
    try {
      const records = await this.prisma.schoolStudentHistory.createMany({
        data: data.records.map((r) => ({
          studentId: r.studentId,
          levelSubjectId: r.levelSubjectId ?? null,
          schoolId: r.schoolId,
          schoolYear: r.schoolYear ?? null,
          finalScore: r.finalScore ?? null,
        })),
      });
      return { success: true, message: `${records.count} registros creados`, data: { count: records.count } };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }

  async deleteSchoolHistory(id: number) {
    try {
      await this.prisma.schoolStudentHistory.delete({ where: { id } });
      return { success: true, message: 'Registro eliminado' };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }

  async updateSchoolHistory(id: number, data: UpdateSchoolHistoryDTO) {
    try {
      const record = await this.prisma.schoolStudentHistory.update({
        where: { id },
        data: {
          ...(data.schoolId !== undefined && { schoolId: data.schoolId }),
          ...(data.schoolYear !== undefined && { schoolYear: data.schoolYear }),
          ...(data.finalScore !== undefined && { finalScore: data.finalScore }),
        },
      });
      return { success: true, message: 'Registro actualizado', data: record };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }

  async updateSchoolHistoryBatch(data: UpdateSchoolHistoryBatchDTO) {
    try {
      const result = await this.prisma.$transaction(
        data.updates.map(u =>
          this.prisma.schoolStudentHistory.update({
            where: { id: u.id },
            data: {
              ...(u.schoolId !== undefined && { schoolId: u.schoolId }),
              ...(u.schoolYear !== undefined && { schoolYear: u.schoolYear }),
              ...(u.finalScore !== undefined && { finalScore: u.finalScore }),
            },
          })
        )
      );
      return { success: true, message: `${result.length} registros actualizados` };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }

  async addFailedSubject(data: CreateFailedSubjectDTO) {
    try {
      const record = await this.prisma.studentFailedSubject.create({
        data: {
          studentId: data.studentId,
          levelSubjectId: data.levelSubjectId,
          date: data.date ?? new Date(),
          finalAverage: data.finalAverage,
          typeOf: data.typeOf,
          status: data.status,
          observations: data.observations,
        },
      });
      return { success: true, message: 'Materia reprobada registrada', data: record };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }

  async deleteFailedSubject(id: number) {
    try {
      await this.prisma.studentFailedSubject.delete({ where: { id } });
      return { success: true, message: 'Registro eliminado' };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }
}
