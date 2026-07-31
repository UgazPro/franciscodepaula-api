import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSchoolHistoryDTO, CreateFailedSubjectAttemptDTO, CreateSchoolHistoryBatchDTO, UpdateSchoolHistoryDTO, UpdateSchoolHistoryBatchDTO } from './academic-history.dto';

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
              schoolYearId: true,
              levelSubjectId: true,
              schoolId: true,
              finalScore: true,
              typeOf: true,
              approvalDate: true,
              status: true,
              levelSubject: {
                include: {
                  highSchoolLevel: { select: { id: true, level: true } },
                  subject: { select: { subject: true, code: true } },
                },
              },
              school: { select: { id: true, schoolName: true } },
              section: { select: { id: true, section: true } },
            },
            orderBy: { schoolYearId: 'asc' },
          },
          enrollments: {
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
              teachingGroup: {
                include: {
                  levelSubject: {
                    include: {
                      subject: { select: { subject: true } },
                      highSchoolLevel: { select: { id: true, level: true } },
                    },
                  },
                  section: { select: { id: true, section: true } },
                },
              },
              attempts: {
                orderBy: { createdAt: 'asc' },
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
            typeOf: 'F',
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

        const levelId = enrollment.section.highSchoolLevel.id;

        return {
          schoolYearId: enrollment.schoolYear.id,
          schoolYearName: enrollment.schoolYear.name,
          enrollmentTypeOf: enrollment.typeOf,
          level: enrollment.section.highSchoolLevel.level,
          section: enrollment.section.section,
          schoolName: currentSchool?.schoolName ?? 'Escuela Actual',
          schoolId: currentSchool?.id ?? 1,
          averageGrade: overallAverage,
          totalSubjects: regularSubjects.length,
          totalGrades: regularSubjects.reduce((sum, t) => sum + t.totalEvaluations, 0),
          subjects: teachingGroups,
          failedSubjects: student.failedSubjects
            .filter((fs) => {
              const fsLevelId = fs.teachingGroup.levelSubject.highSchoolLevel.id;
              return fsLevelId === levelId;
            })
            .map((fs) => ({
              levelSubjectId: fs.teachingGroup.levelSubjectId,
              highSchoolLevelId: fs.teachingGroup.levelSubject.highSchoolLevel.id,
              subjectName: fs.teachingGroup.levelSubject.subject.subject,
              section: fs.teachingGroup.section?.section ?? null,
              attempts: fs.attempts.map((a) => ({
                id: a.id,
                score: a.score,
                evaluationDate: a.evaluationDate,
                observations: a.observations,
                createdAt: a.createdAt,
                createdBy: a.createdBy,
              })),
            })),
          _levelOrder: getLevelOrder(enrollment.section.highSchoolLevel.level),
        };
      });

      // Merge schoolStudentHistory records into enrollment entries (repitiente: approved + repeating subjects)
      const specialSubjectCodes = ['CRP', 'ROB', 'MUS', 'OV', 'MET'];
      const consumedHistoryIds = new Set<number>();

      for (const entry of enrollmentHistory) {
        const levelId = entry.subjects[0]
          ? student.studentHistories.find(
              (sh) => sh.levelSubject?.subject?.subject === entry.subjects[0]?.subjectName,
            )?.levelSubject?.highSchoolLevelId
          : null;

        if (levelId == null) {
          // Fallback: try to find levelId from the enrollment's section
          const enrollment = student.enrollments.find(
            (e) => e.schoolYear.id === entry.schoolYearId,
          );
          const fallbackLevelId = enrollment?.section?.highSchoolLevelId;
          if (fallbackLevelId == null) continue;

          const relevantRecords = student.studentHistories.filter(
            (sh) =>
              sh.schoolYearId === entry.schoolYearId &&
              sh.levelSubject?.highSchoolLevelId === fallbackLevelId &&
              sh.levelSubject != null &&
              !entry.subjects.some((s) => s.subjectName === sh.levelSubject!.subject?.subject),
          );

          for (const sh of relevantRecords) {
            consumedHistoryIds.add(sh.id);
            entry.subjects.push({
              subjectName: sh.levelSubject!.subject?.subject ?? 'Materia Desconocida',
              isSpecialGroup: specialSubjectCodes.includes(sh.levelSubject!.subject?.code ?? ''),
              definitiva: sh.typeOf === 'F' && sh.finalScore != null ? Number(sh.finalScore) : null,
              totalEvaluations: 0,
              gradedEvaluations: 0,
              grades: [],
              periodAverages: [],
              typeOf: sh.typeOf ?? 'F',
            });
          }
          continue;
        }

        const relevantRecords = student.studentHistories.filter(
          (sh) =>
            sh.schoolYearId === entry.schoolYearId &&
            sh.levelSubject?.highSchoolLevelId === levelId &&
            sh.levelSubject != null &&
            !entry.subjects.some((s) => s.subjectName === sh.levelSubject!.subject?.subject),
        );

        for (const sh of relevantRecords) {
          consumedHistoryIds.add(sh.id);
          entry.subjects.push({
            subjectName: sh.levelSubject!.subject?.subject ?? 'Materia Desconocida',
            isSpecialGroup: specialSubjectCodes.includes(sh.levelSubject!.subject?.code ?? ''),
            definitiva: sh.typeOf === 'F' && sh.finalScore != null ? Number(sh.finalScore) : null,
            totalEvaluations: 0,
            gradedEvaluations: 0,
            grades: [],
            periodAverages: [],
            typeOf: sh.typeOf ?? 'F',
          });
        }
      }

      // Build history entries from SchoolStudentHistory (previous schools)
      // Group by level (highSchoolLevelId), excluding records already merged into enrollment entries
      const historyByLevel = new Map<number, typeof student.studentHistories>();
      for (const sh of student.studentHistories) {
        if (consumedHistoryIds.has(sh.id)) continue;
        const levelId = sh.levelSubject?.highSchoolLevelId;
        if (levelId == null) continue; // Skip records without levelSubject
        if (!historyByLevel.has(levelId)) {
          historyByLevel.set(levelId, []);
        }
        historyByLevel.get(levelId)!.push(sh);
      }

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
            typeOf: sh.typeOf ?? 'F',
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
        const schoolYearId = records[0]?.schoolYearId ?? null;

        return {
          schoolYearId,
          schoolYearName: null,
          level: levelName,
          section: null,
          schoolName: school?.schoolName ?? 'Escuela Anterior',
          schoolId: school?.id ?? null,
          averageGrade: overallAverage,
          totalSubjects: regularSubjects.length,
          totalGrades: 0,
          subjects,
          records: records.map((r) => ({
            id: r.id,
            levelSubjectId: r.levelSubjectId,
            schoolId: r.schoolId,
            schoolYearId: r.schoolYearId,
            finalScore: r.finalScore != null ? Number(r.finalScore) : null,
            typeOf: r.typeOf,
            approvalDate: r.approvalDate,
            status: r.status,
            subjectName: r.levelSubject?.subject?.subject ?? 'Desconocida',
          })),
          _levelOrder: getLevelOrder(levelName),
        };
      });

      // Combine and sort by level order
      const allHistory = [...enrollmentHistory, ...previousHistory].sort(
        (a, b) => a._levelOrder - b._levelOrder,
      );

      // Top-level failed subjects (independent of enrollment status)
      const allFailedSubjects = student.failedSubjects.map((fs) => ({
        id: fs.id,
        levelSubjectId: fs.teachingGroup.levelSubjectId,
        highSchoolLevelId: fs.teachingGroup.levelSubject.highSchoolLevel.id,
        subjectName: fs.teachingGroup.levelSubject.subject.subject,
        section: fs.teachingGroup.section?.section ?? null,
        attempts: fs.attempts.map((a) => ({
          id: a.id,
          score: a.score,
          evaluationDate: a.evaluationDate,
          observations: a.observations,
          createdAt: a.createdAt,
          createdBy: a.createdBy,
        })),
      }));

      // studentFailedSubject records only exist for Materia Pendiente enrollments
      const activeEnrollmentTypeOf = allFailedSubjects.length > 0 ? 'Materia Pendiente' : null;

      return {
        studentId,
        studentName: `${student.person.firstNames} ${student.person.lastNames}`,
        currentSchool,
        history: allHistory,
        failedSubjects: allFailedSubjects,
        enrollmentTypeOf: activeEnrollmentTypeOf,
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
          schoolYearId: data.schoolYearId ?? null,
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
          schoolYearId: r.schoolYearId ?? null,
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
          ...(data.schoolYearId !== undefined && { schoolYearId: data.schoolYearId }),
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
              ...(u.schoolYearId !== undefined && { schoolYearId: u.schoolYearId }),
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

  async addFailedSubjectAttempt(failedSubjectId: number, data: CreateFailedSubjectAttemptDTO) {
    try {
      // Verify the failed subject exists
      const failedSubject = await this.prisma.studentFailedSubject.findUnique({
        where: { id: failedSubjectId },
      });
      if (!failedSubject) {
        throw new BadRequestException('Materia pendiente no encontrada');
      }

      // Check max 4 attempts
      const attemptCount = await this.prisma.studentFailedSubjectAttempt.count({
        where: { studentFailedSubjectsId: failedSubjectId },
      });
      if (attemptCount >= 4) {
        throw new BadRequestException('Se ha alcanzado el máximo de 4 intentos para esta materia');
      }

      // Parse evaluationDate from "YYYY-MM" format to Date (day = 1)
      let evaluationDate: Date | null = null;
      if (data.evaluationDate) {
        evaluationDate = new Date(`${data.evaluationDate}-01`);
      }

      const record = await this.prisma.studentFailedSubjectAttempt.create({
        data: {
          studentFailedSubjectsId: failedSubjectId,
          score: data.score ?? null,
          evaluationDate,
          observations: data.observations ?? null,
          createdBy: data.createdBy ?? null,
        },
      });
      return { success: true, message: 'Intento registrado', data: record };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(String(error));
    }
  }

  async getAllFailedSubjects() {
    try {
      const specialSubjectCodes = ['CRP', 'ROB', 'MUS', 'OV', 'MET'];

      const failedSubjects = await this.prisma.studentFailedSubject.findMany({
        where: { status: true },
        include: {
          student: {
            include: {
              person: { select: { firstNames: true, lastNames: true, identificationNumber: true } },
              enrollments: {
                where: { status: true },
                include: {
                  section: {
                    include: {
                      highSchoolLevel: { select: { id: true, level: true } },
                    },
                  },
                },
                orderBy: { schoolYearId: 'desc' },
                take: 1,
              },
            },
          },
          teachingGroup: {
            include: {
              levelSubject: {
                include: {
                  subject: { select: { subject: true, code: true } },
                  highSchoolLevel: { select: { id: true, level: true } },
                },
              },
              section: { select: { id: true, section: true } },
            },
          },
          attempts: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Filter out special subjects (CRP, ROB, MUS, MET, OV)
      const filtered = failedSubjects.filter(
        (fs) => !specialSubjectCodes.includes(fs.teachingGroup.levelSubject.subject.code ?? '')
      );

      // Group by highSchoolLevelId
      const levelMap = new Map<number, {
        highSchoolLevelId: number;
        level: string;
        students: Map<number, {
          studentId: number;
          studentName: string;
          identification: string;
          enrollmentTypeOf: string;
          currentLevel: string;
          currentSection: string;
          failedSubjects: Array<{
            id: number;
            levelSubjectId: number;
            subjectName: string;
            attempts: Array<{
              id: number;
              score: number | null;
              evaluationDate: Date | null;
              observations: string | null;
              createdAt: Date;
            }>;
          }>;
        }>;
      }>();

      for (const fs of filtered) {
        const levelId = fs.teachingGroup.levelSubject.highSchoolLevel.id;
        const levelName = fs.teachingGroup.levelSubject.highSchoolLevel.level;
        const studentId = fs.studentId;

        if (!levelMap.has(levelId)) {
          levelMap.set(levelId, {
            highSchoolLevelId: levelId,
            level: levelName,
            students: new Map(),
          });
        }

        const level = levelMap.get(levelId)!;

        if (!level.students.has(studentId)) {
          const activeEnrollment = fs.student.enrollments[0];
          level.students.set(studentId, {
            studentId,
            studentName: `${fs.student.person.firstNames} ${fs.student.person.lastNames}`,
            identification: fs.student.person.identificationNumber,
            enrollmentTypeOf: activeEnrollment?.typeOf ?? 'Materia Pendiente',
            currentLevel: activeEnrollment?.section?.highSchoolLevel?.level ?? levelName,
            currentSection: activeEnrollment?.section?.section ?? 'UR',
            failedSubjects: [],
          });
        }

        const student = level.students.get(studentId)!;
        student.failedSubjects.push({
          id: fs.id,
          levelSubjectId: fs.teachingGroup.levelSubjectId,
          subjectName: fs.teachingGroup.levelSubject.subject.subject,
          attempts: fs.attempts.map((a) => ({
            id: a.id,
            score: a.score,
            evaluationDate: a.evaluationDate,
            observations: a.observations,
            createdAt: a.createdAt,
          })),
        });
      }

      // Convert maps to arrays and sort
      const levels = Array.from(levelMap.values())
        .map((level) => ({
          ...level,
          students: Array.from(level.students.values()),
          studentCount: level.students.size,
        }))
        .sort((a, b) => a.highSchoolLevelId - b.highSchoolLevelId);

      return { success: true, data: levels };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(String(error));
    }
  }
}
