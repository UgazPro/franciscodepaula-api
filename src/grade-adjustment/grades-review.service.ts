import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';

export interface GradesReviewSubject {
  levelSubjectId: number;
  subjectName: string;
  subjectCode: string;
  teachingGroupId: number;
  teacherName: string;
  isSpecialGroup: boolean;
  periodGrade: number | null;
  totalEvaluations: number;
  gradedEvaluations: number;
}

export interface GradesReviewSection {
  sectionId: number;
  level: string;
  section: string;
  label: string;
  studentCount: number;
  subjects: GradesReviewSubject[];
  sectionAverage: number | null;
}

export interface SubjectGradeDetail {
  evaluationId: number;
  topic: string;
  percentage: number;
  evaluationType: string;
  score: number | null;
}

export interface SubjectStudent {
  studentId: number;
  studentName: string;
  grades: SubjectGradeDetail[];
  weightedAverage: number | null;
}

@Injectable()
export class GradesReviewService {
  constructor(private prisma: PrismaService) {}

  async getSectionsOverview(periodId: number) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
        include: { periods: true },
      });

      if (!activeSchoolYear) {
        badResponse.message = 'No hay año escolar activo';
        return badResponse;
      }

      const period = activeSchoolYear.periods.find((p) => p.id === periodId);
      if (!period) {
        badResponse.message = 'Periodo no válido';
        return badResponse;
      }

      const sections = await this.prisma.section.findMany({
        where: { schoolYearId: activeSchoolYear.id },
        include: {
          highSchoolLevel: true,
          enrollments: { where: { status: true } },
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
          employee: {
            include: {
              user: {
                include: {
                  person: { select: { firstNames: true, lastNames: true } },
                },
              },
            },
          },
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
        s.enrollments.map((e) => e.studentId),
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

      const gradeCountByEval = new Map<number, number>();
      for (const gr of gradeRecords) {
        if (gr.score != null) {
          gradeCountByEval.set(
            gr.evaluationId,
            (gradeCountByEval.get(gr.evaluationId) ?? 0) + 1,
          );
        }
      }

      const sectionsByLevelSection = new Map<
        string,
        {
          sectionId: number;
          level: string;
          section: string;
          label: string;
          studentCount: number;
          subjects: GradesReviewSubject[];
        }
      >();

      for (const sec of sections) {
        const levelName = sec.highSchoolLevel.level;
        const sectionName = sec.section;
        const key = `${sec.highSchoolLevelId}-${sec.id}`;

        sectionsByLevelSection.set(key, {
          sectionId: sec.id,
          level: levelName,
          section: sectionName,
          label: `${levelName} ${sectionName}`,
          studentCount: sec.enrollments.length,
          subjects: [],
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

        const teacherName = tg.employee
          ? `${tg.employee.user.person.firstNames} ${tg.employee.user.person.lastNames}`
          : 'Sin asignar';

        const evals = evaluationsByTG.get(tg.id) ?? [];
        const totalPercentage = evals.reduce(
          (sum, e) => sum + Number(e.percentage),
          0,
        );

        let periodGrade: number | null = null;

        if (totalPercentage > 0) {
          const totalStudents = sectionData.studentCount;
          if (totalStudents > 0) {
            let sumOfStudentAverages = 0;
            let studentsWithGrades = 0;

            for (const enroll of sections.find(
              (s) => s.id === sectionData.sectionId,
            )?.enrollments ?? []) {
              let studentWeighted = 0;
              let studentTotalPct = 0;
              for (const ev of evals) {
                const grade = gradeRecords.find(
                  (gr) =>
                    gr.studentId === enroll.studentId &&
                    gr.evaluationId === ev.id,
                );
                if (grade?.score != null) {
                  studentWeighted +=
                    (grade.score * Number(ev.percentage)) / totalPercentage;
                  studentTotalPct += Number(ev.percentage);
                }
              }
              if (studentTotalPct > 0) {
                sumOfStudentAverages += Math.round(studentWeighted);
                studentsWithGrades++;
              }
            }

            if (studentsWithGrades > 0) {
              periodGrade = Math.round(
                sumOfStudentAverages / studentsWithGrades,
              );
            }
          }
        }

        const totalEvaluations = evals.length;
        let gradedEvaluations = 0;
        for (const ev of evals) {
          const count = gradeCountByEval.get(ev.id) ?? 0;
          if (count > 0) gradedEvaluations++;
        }

        sectionData.subjects.push({
          levelSubjectId: ls.id,
          subjectName,
          subjectCode,
          teachingGroupId: tg.id,
          teacherName,
          isSpecialGroup,
          periodGrade,
          totalEvaluations,
          gradedEvaluations,
        });
      }

      const result: GradesReviewSection[] = [];
      for (const secData of sectionsByLevelSection.values()) {
        const nonSpecialSubjects = secData.subjects.filter(
          (s) => !s.isSpecialGroup && s.periodGrade !== null,
        );
        const sectionAverage =
          nonSpecialSubjects.length > 0
            ? Math.round(
                nonSpecialSubjects.reduce(
                  (sum, s) => sum + (s.periodGrade ?? 0),
                  0,
                ) / nonSpecialSubjects.length,
              )
            : null;

        result.push({
          ...secData,
          sectionAverage,
        });
      }

      return { success: true, data: { sections: result } };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getSubjectGrades(teachingGroupId: number, periodId: number) {
    try {
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { isActive: true },
      });

      if (!activeSchoolYear) {
        badResponse.message = 'No hay año escolar activo';
        return badResponse;
      }

      const tg = await this.prisma.teachingGroup.findUnique({
        where: { id: teachingGroupId },
        include: {
          levelSubject: {
            include: { subject: true },
          },
          section: {
            include: {
              highSchoolLevel: true,
            },
          },
          employee: {
            include: {
              user: {
                include: {
                  person: { select: { firstNames: true, lastNames: true } },
                },
              },
            },
          },
        },
      });

      if (!tg) {
        badResponse.message = 'Grupo de enseñanza no encontrado';
        return badResponse;
      }

      const subjectName = tg.levelSubject.subject.subject;
      const teacherName = tg.employee
        ? `${tg.employee.user.person.firstNames} ${tg.employee.user.person.lastNames}`
        : 'Sin asignar';
      const sectionLabel = tg.section
        ? `${tg.section.highSchoolLevel.level} ${tg.section.section}`
        : '';

      const evaluations = await this.prisma.evaluation.findMany({
        where: { teachingGroupId, periodId },
        include: { evaluationType: true },
        orderBy: { createdAt: 'asc' },
      });

      if (evaluations.length === 0) {
        return {
          success: true,
          data: {
            subject: { subjectName, teacherName, sectionLabel },
            students: [],
          },
        };
      }

      const evalIds = evaluations.map((e) => e.id);

      let enrolledStudentIds: number[] = [];
      if (tg.sectionId) {
        const enrollments = await this.prisma.studentEnrollment.findMany({
          where: { sectionId: tg.sectionId, status: true },
          select: { studentId: true },
        });
        enrolledStudentIds = enrollments.map((e) => e.studentId);
      } else {
        const studentGroups = await this.prisma.studentTeachingGroup.findMany({
            where: { teachingGroupId },
            select: {
              studentEnrollment: { select: { studentId: true } },
            },
          });
        enrolledStudentIds = studentGroups.map(
          (sg) => sg.studentEnrollment.studentId,
        );
      }

      if (enrolledStudentIds.length === 0) {
        return {
          success: true,
          data: {
            subject: { subjectName, teacherName, sectionLabel },
            students: [],
          },
        };
      }

      const gradeRecords = await this.prisma.gradeRecord.findMany({
        where: {
          evaluationId: { in: evalIds },
          studentId: { in: enrolledStudentIds },
        },
        include: {
          student: {
            include: {
              person: {
                select: { firstNames: true, lastNames: true },
              },
            },
          },
        },
      });

      const evalMap = new Map(
        evaluations.map((e) => [
          e.id,
          {
            topic: e.topic,
            percentage: Number(e.percentage),
            evaluationType: e.evaluationType.evaluationType,
          },
        ]),
      );

      const studentsMap = new Map<
        number,
        {
          studentId: number;
          studentName: string;
          grades: SubjectGradeDetail[];
        }
      >();

      for (const gr of gradeRecords) {
        if (!studentsMap.has(gr.studentId)) {
          studentsMap.set(gr.studentId, {
            studentId: gr.studentId,
            studentName: `${gr.student.person.firstNames} ${gr.student.person.lastNames}`,
            grades: [],
          });
        }
        const studentData = studentsMap.get(gr.studentId)!;
        const evInfo = evalMap.get(gr.evaluationId);
        studentData.grades.push({
          evaluationId: gr.evaluationId,
          topic: evInfo?.topic ?? '',
          percentage: evInfo?.percentage ?? 0,
          evaluationType: evInfo?.evaluationType ?? '',
          score: gr.score,
        });
      }

      const students: SubjectStudent[] = [];
      for (const [, data] of studentsMap) {
        const totalPercentage = data.grades.reduce(
          (sum, g) => sum + g.percentage,
          0,
        );
        const weightedSum = data.grades.reduce(
          (sum, g) =>
            sum + (g.score != null ? (g.score / 20) * g.percentage : 0),
          0,
        );
        const weightedAverage =
          totalPercentage > 0 && data.grades.some((g) => g.score != null)
            ? Math.round((weightedSum / totalPercentage) * 20 * 10) / 10
            : null;

        students.push({
          studentId: data.studentId,
          studentName: data.studentName,
          grades: data.grades,
          weightedAverage,
        });
      }

      students.sort((a, b) =>
        a.studentName.localeCompare(b.studentName, 'es', {
          sensitivity: 'base',
        }),
      );

      return {
        success: true,
        data: {
          subject: { subjectName, teacherName, sectionLabel },
          students,
        },
      };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
