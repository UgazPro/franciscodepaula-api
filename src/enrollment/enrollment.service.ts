import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { EnrollmentDTO, StudentSectionDTO, StudentRepresentativeDTO } from './enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(private prismaService: PrismaService) {}

  /////////////////////////////////////////////////
  // ENROLLMENTS
  /////////////////////////////////////////////////

  async getEnrollments(schoolYearId?: number, sectionId?: number, studentId?: number) {
    try {
      const where: any = {};

      if (schoolYearId) where.schoolYearId = schoolYearId;
      if (sectionId) where.sectionId = sectionId;
      if (studentId) where.studentId = studentId;

      const enrollments = await this.prismaService.studentEnrollment.findMany({
        where,
        include: {
          student: {
            include: {
              person: true,
            },
          },
          schoolYear: true,
          section: {
            include: {
              highSchoolLevel: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      return enrollments;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getEnrollmentById(id: number) {
    try {
      const enrollment = await this.prismaService.studentEnrollment.findUnique({
        where: { id },
        include: {
          student: {
            include: {
              person: true,
            },
          },
          schoolYear: true,
          section: {
            include: {
              highSchoolLevel: true,
            },
          },
        },
      });

      if (!enrollment) {
        badResponse.message = 'Inscripción no encontrada';
        return badResponse;
      }

      return enrollment;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createEnrollment(data: EnrollmentDTO) {
    try {
      const student = await this.prismaService.student.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        badResponse.message = 'Estudiante no encontrado';
        return badResponse;
      }

      const schoolYear = await this.prismaService.schoolYear.findUnique({
        where: { id: data.schoolYearId },
      });

      if (!schoolYear) {
        badResponse.message = 'Año escolar no encontrado';
        return badResponse;
      }

      const section = await this.prismaService.section.findUnique({
        where: { id: data.sectionId },
      });

      if (!section) {
        badResponse.message = 'Sección no encontrada';
        return badResponse;
      }

      const enrollment = await this.prismaService.studentEnrollment.create({
        data: {
          studentId: data.studentId,
          schoolYearId: data.schoolYearId,
          sectionId: data.sectionId,
          enrollmentDate: data.enrollmentDate,
          status: data.status ?? true,
        },
        include: {
          student: {
            include: {
              person: true,
            },
          },
          schoolYear: true,
          section: {
            include: {
              highSchoolLevel: true,
            },
          },
        },
      });

      return enrollment;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateEnrollment(id: number, data: EnrollmentDTO) {
    try {
      const existing = await this.prismaService.studentEnrollment.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Inscripción no encontrada';
        return badResponse;
      }

      const enrollment = await this.prismaService.studentEnrollment.update({
        where: { id },
        data: {
          sectionId: data.sectionId,
          enrollmentDate: data.enrollmentDate,
          status: data.status,
        },
        include: {
          student: {
            include: {
              person: true,
            },
          },
          schoolYear: true,
          section: {
            include: {
              highSchoolLevel: true,
            },
          },
        },
      });

      return enrollment;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // STUDENT SECTIONS
  /////////////////////////////////////////////////

  async getStudentSections() {
    try {
      const sections = await this.prismaService.studentSection.findMany({
        include: {
          student: {
            include: {
              person: true,
            },
          },
          section: {
            include: {
              highSchoolLevel: true,
              schoolYear: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      return sections;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createStudentSection(data: StudentSectionDTO) {
    try {
      const student = await this.prismaService.student.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        badResponse.message = 'Estudiante no encontrado';
        return badResponse;
      }

      const section = await this.prismaService.section.findUnique({
        where: { id: data.sectionId },
      });

      if (!section) {
        badResponse.message = 'Sección no encontrada';
        return badResponse;
      }

      const exists = await this.prismaService.studentSection.findFirst({
        where: {
          studentId: data.studentId,
          sectionId: data.sectionId,
        },
      });

      if (exists) {
        badResponse.message = 'El estudiante ya está asignado a esta sección';
        return badResponse;
      }

      const studentSection = await this.prismaService.studentSection.create({
        data: {
          studentId: data.studentId,
          sectionId: data.sectionId,
          enrollmentDate: data.enrollmentDate,
          status: data.status ?? true,
        },
        include: {
          student: {
            include: {
              person: true,
            },
          },
          section: {
            include: {
              highSchoolLevel: true,
              schoolYear: true,
            },
          },
        },
      });

      return studentSection;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateStudentSection(id: number, data: StudentSectionDTO) {
    try {
      const existing = await this.prismaService.studentSection.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Asignación no encontrada';
        return badResponse;
      }

      const studentSection = await this.prismaService.studentSection.update({
        where: { id },
        data: {
          sectionId: data.sectionId,
          enrollmentDate: data.enrollmentDate,
          status: data.status,
        },
        include: {
          student: {
            include: {
              person: true,
            },
          },
          section: {
            include: {
              highSchoolLevel: true,
              schoolYear: true,
            },
          },
        },
      });

      return studentSection;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // STUDENT REPRESENTATIVES
  /////////////////////////////////////////////////

  async getPendingEnrollments() {
    try {
      const students = await this.prismaService.student.findMany({
        where: {
          enrollments: {
            none: {},
          },
        },
        include: {
          person: true,
        },
        orderBy: {
          person: {
            firstNames: 'asc',
          },
        },
      });

      return students;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createStudentRepresentative(data: StudentRepresentativeDTO) {
    try {
      const student = await this.prismaService.student.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        badResponse.message = 'Estudiante no encontrado';
        return badResponse;
      }

      const representative = await this.prismaService.representative.findUnique({
        where: { id: data.representativeId },
      });

      if (!representative) {
        badResponse.message = 'Representante no encontrado';
        return badResponse;
      }

      const exists = await this.prismaService.studentRepresentative.findFirst({
        where: {
          studentId: data.studentId,
          representativeId: data.representativeId,
        },
      });

      if (exists) {
        badResponse.message = 'El representante ya está asignado a este estudiante';
        return badResponse;
      }

      const relation = await this.prismaService.studentRepresentative.create({
        data: {
          studentId: data.studentId,
          representativeId: data.representativeId,
        },
        include: {
          student: {
            include: {
              person: true,
            },
          },
          representative: {
            include: {
              user: {
                include: {
                  person: true,
                },
              },
            },
          },
        },
      });

      return relation;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async deleteStudentRepresentative(studentId: number, representativeId: number) {
    try {
      const relation = await this.prismaService.studentRepresentative.findFirst({
        where: {
          studentId,
          representativeId,
        },
      });

      if (!relation) {
        badResponse.message = 'Relación no encontrada';
        return badResponse;
      }

      await this.prismaService.studentRepresentative.delete({
        where: { id: relation.id },
      });

      return { message: 'Representante removido correctamente', success: true };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
