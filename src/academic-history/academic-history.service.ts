import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSchoolHistoryDTO, CreateFailedSubjectAttemptDTO, CreateSchoolHistoryBatchDTO, UpdateSchoolHistoryDTO, UpdateSchoolHistoryBatchDTO, CreateReviewDTO } from './academic-history.dto';

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

  async getAllReviewStudents() {
    try {
      const specialSubjectCodes = ['CRP', 'ROB', 'MUS', 'OV', 'MET'];

      // 1. Get active school year
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!activeSchoolYear) {
        throw new BadRequestException('No hay año escolar activo');
      }
      const schoolYearId = activeSchoolYear.id;

      // 2. Get all active enrollments for the active year
      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: { status: true, schoolYearId },
        include: {
          student: {
            include: {
              person: { select: { firstNames: true, lastNames: true, identificationNumber: true } },
            },
          },
          section: {
            include: {
              highSchoolLevel: { select: { id: true, level: true } },
            },
          },
        },
      });

      // 3. Get all teaching groups for the active year (to know which subjects exist per level)
      const teachingGroups = await this.prisma.teachingGroup.findMany({
        where: { schoolYearId, status: true },
        include: {
          levelSubject: {
            include: {
              subject: { select: { id: true, subject: true, code: true } },
              highSchoolLevel: { select: { id: true, level: true } },
            },
          },
          section: { select: { id: true, section: true } },
        },
      });

      // 4. Get all grade records for the active year
      const gradeRecords = await this.prisma.gradeRecord.findMany({
        where: {
          evaluation: {
            teachingGroup: { schoolYearId },
          },
        },
        include: {
          evaluation: {
            include: {
              period: { select: { id: true, period: true } },
              teachingGroup: {
                select: { id: true, levelSubjectId: true, sectionId: true },
              },
            },
          },
        },
      });

      // 5. Build subjects map per level (excluding special groups)
      const subjectsByLevel = new Map<number, Map<number, { levelSubjectId: number; subjectCode: string; subjectName: string }>>();
      for (const tg of teachingGroups) {
        if (tg.isSpecialGroup) continue;
        const code = tg.levelSubject.subject.code;
        if (specialSubjectCodes.includes(code ?? '')) continue;

        const levelId = tg.levelSubject.highSchoolLevel.id;
        const lsId = tg.levelSubjectId;

        if (!subjectsByLevel.has(levelId)) {
          subjectsByLevel.set(levelId, new Map());
        }
        const levelSubjects = subjectsByLevel.get(levelId)!;
        if (!levelSubjects.has(lsId)) {
          levelSubjects.set(lsId, {
            levelSubjectId: lsId,
            subjectCode: tg.levelSubject.subject.code ?? tg.levelSubject.subject.subject.substring(0, 4).toUpperCase(),
            subjectName: tg.levelSubject.subject.subject,
          });
        }
      }

      // 6. Compute average of 3 moments per student per subject
      // key = `${studentId}-${levelSubjectId}` → { periodGrades: Map<periodName, weightedAvg> }
      const studentSubjectGrades = new Map<string, Map<string, { totalWeighted: number; totalPct: number }>>();

      for (const gr of gradeRecords) {
        const studentId = gr.studentId;
        const lsId = gr.evaluation.teachingGroup.levelSubjectId;
        const periodName = gr.evaluation.period.period;
        const score = gr.score != null ? Number(gr.score) : null;
        const percentage = Number(gr.evaluation.percentage);

        if (score == null) continue;

        const key = `${studentId}-${lsId}`;
        if (!studentSubjectGrades.has(key)) {
          studentSubjectGrades.set(key, new Map());
        }
        const periodMap = studentSubjectGrades.get(key)!;
        if (!periodMap.has(periodName)) {
          periodMap.set(periodName, { totalWeighted: 0, totalPct: 0 });
        }
        const p = periodMap.get(periodName)!;
        p.totalWeighted += (score / 20) * percentage;
        p.totalPct += percentage;
      }

      // Compute average of 3 moments
      const subjectAverages = new Map<string, { studentId: number; levelSubjectId: number; average3Moments: number | null; passed: boolean }>();
      for (const [key, periodMap] of studentSubjectGrades) {
        const [studentIdStr, lsIdStr] = key.split('-');
        const studentId = parseInt(studentIdStr);
        const levelSubjectId = parseInt(lsIdStr);

        const periodAverages: number[] = [];
        for (const [, data] of periodMap) {
          if (data.totalPct > 0) {
            periodAverages.push((data.totalWeighted / data.totalPct) * 20);
          }
        }

        let average3Moments: number | null = null;
        if (periodAverages.length > 0) {
          average3Moments = Math.round((periodAverages.reduce((a, b) => a + b, 0) / periodAverages.length) * 10) / 10;
        }

        subjectAverages.set(key, {
          studentId,
          levelSubjectId,
          average3Moments,
          passed: average3Moments != null && average3Moments >= 10,
        });
      }

      // 7. Get existing review grades (typeOf = 'R') to show them in the UI
      const existingReviews = await this.prisma.schoolStudentHistory.findMany({
        where: {
          schoolYearId,
          typeOf: 'R',
          status: true,
        },
        select: {
          studentId: true,
          levelSubjectId: true,
          finalScore: true,
        },
      });

      const reviewMap = new Map<string, number>();
      for (const r of existingReviews) {
        if (r.levelSubjectId != null) {
          reviewMap.set(`${r.studentId}-${r.levelSubjectId}`, Number(r.finalScore));
        }
      }

      // 8. Group enrollments by level
      const levelMap = new Map<number, {
        highSchoolLevelId: number;
        level: string;
        students: Map<number, {
          studentId: number;
          studentName: string;
          identification: string;
          section: string;
          sectionId: number;
          subjectGrades: Array<{
            levelSubjectId: number;
            subjectCode: string;
            subjectName: string;
            average3Moments: number | null;
            passed: boolean;
            reviewScore: number | null;
          }>;
        }>;
      }>();

      for (const enrollment of enrollments) {
        const levelId = enrollment.section.highSchoolLevel.id;
        const studentId = enrollment.studentId;

        if (!levelMap.has(levelId)) {
          levelMap.set(levelId, {
            highSchoolLevelId: levelId,
            level: enrollment.section.highSchoolLevel.level,
            students: new Map(),
          });
        }
        const level = levelMap.get(levelId)!;

        if (!level.students.has(studentId)) {
          const firstName = enrollment.student.person.firstNames.split(' ')[0];
          const firstLast = enrollment.student.person.lastNames.split(' ')[0];

          level.students.set(studentId, {
            studentId,
            studentName: `${firstName} ${firstLast}`,
            identification: enrollment.student.person.identificationNumber,
            section: enrollment.section.section,
            sectionId: enrollment.section.id,
            subjectGrades: [],
          });
        }

        const student = level.students.get(studentId)!;

        // Add subject grades for this student (only subjects that exist for this level)
        const levelSubjects = subjectsByLevel.get(levelId);
        if (!levelSubjects) continue;

        for (const [, subjInfo] of levelSubjects) {
          // Skip if already added
          if (student.subjectGrades.some(sg => sg.levelSubjectId === subjInfo.levelSubjectId)) continue;

          const avgKey = `${studentId}-${subjInfo.levelSubjectId}`;
          const avg = subjectAverages.get(avgKey);
          const reviewKey = `${studentId}-${subjInfo.levelSubjectId}`;
          const reviewScore = reviewMap.get(reviewKey) ?? null;

          student.subjectGrades.push({
            levelSubjectId: subjInfo.levelSubjectId,
            subjectCode: subjInfo.subjectCode,
            subjectName: subjInfo.subjectName,
            average3Moments: avg?.average3Moments ?? null,
            passed: avg?.passed ?? false,
            reviewScore,
          });
        }
      }

      // 9. Filter out students who passed all subjects (only keep those with at least 1 failing subject)
      for (const [, level] of levelMap) {
        const studentsWithFailing = Array.from(level.students.values())
          .filter(student => student.subjectGrades.some(sg => !sg.passed));
        level.students = new Map(studentsWithFailing.map(s => [s.studentId, s]));
      }

      // 10. Convert maps to arrays and sort (always show all levels)
      const levels = Array.from(levelMap.values())
        .map((level) => ({
          highSchoolLevelId: level.highSchoolLevelId,
          level: level.level,
          studentCount: level.students.size,
          subjects: Array.from(subjectsByLevel.get(level.highSchoolLevelId)?.values() ?? []),
          students: Array.from(level.students.values()),
        }))
        .sort((a, b) => a.highSchoolLevelId - b.highSchoolLevelId);

      return { success: true, data: levels };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(String(error));
    }
  }

  async createReview(data: CreateReviewDTO) {
    try {
      const record = await this.prisma.schoolStudentHistory.create({
        data: {
          studentId: data.studentId,
          levelSubjectId: data.levelSubjectId,
          sectionId: data.sectionId,
          schoolId: data.schoolId,
          schoolYearId: data.schoolYearId,
          finalScore: data.finalScore,
          typeOf: 'R',
          status: true,
        },
      });
      return { success: true, message: 'Nota de revisión guardada', data: record };
    } catch (error) {
      throw new BadRequestException(String(error));
    }
  }
}
