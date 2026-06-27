import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { EnrollmentDTO, StudentSectionDTO, StudentRepresentativeDTO, FullEnrollmentDTO } from './enrollment.dto';
import * as bcrypt from 'bcryptjs';

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
          status: false,
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

      return { success: true, message: 'Inscripción creada exitosamente', data: enrollment };
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
          schoolYearId: data.schoolYearId,
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

      return { success: true, message: 'Matrícula actualizada exitosamente', data: enrollment };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // STUDENT SECTION ASSIGNMENTS (via enrollment)
  /////////////////////////////////////////////////

  async getStudentSections() {
    try {
      const sections = await this.prismaService.studentEnrollment.findMany({
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
          schoolYear: true,
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

      const schoolYear = await this.prismaService.schoolYear.findUnique({
        where: { id: data.schoolYearId },
      });

      if (!schoolYear) {
        badResponse.message = 'Año escolar no encontrado';
        return badResponse;
      }

      const exists = await this.prismaService.studentEnrollment.findFirst({
        where: {
          studentId: data.studentId,
          sectionId: data.sectionId,
          schoolYearId: data.schoolYearId,
        },
      });

      if (exists) {
        badResponse.message = 'El estudiante ya está asignado a esta sección';
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
          section: {
            include: {
              highSchoolLevel: true,
              schoolYear: true,
            },
          },
          schoolYear: true,
        },
      });

      return { success: true, message: 'Sección asignada exitosamente', data: enrollment };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateStudentSection(id: number, data: StudentSectionDTO) {
    try {
      const existing = await this.prismaService.studentEnrollment.findUnique({
        where: { id },
      });

      if (!existing) {
        badResponse.message = 'Asignación no encontrada';
        return badResponse;
      }

      const enrollment = await this.prismaService.studentEnrollment.update({
        where: { id },
        data: {
          schoolYearId: data.schoolYearId,
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
          schoolYear: true,
        },
      });

      return { success: true, message: 'Sección actualizada exitosamente', data: enrollment };
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

      return { success: true, message: 'Representante asignado exitosamente', data: relation };
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

      return { success: true, message: 'Representante removido exitosamente', data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // FULL ENROLLMENT (atomic creation)
  /////////////////////////////////////////////////

  async createFullEnrollment(data: FullEnrollmentDTO) {
    const hashedPassword = await bcrypt.hash(data.identificationNumber, 10);

    const result = await this.prismaService.$transaction(async (tx) => {
      // 1. Validate student CI uniqueness
      const existingStudentPerson = await tx.person.findUnique({
        where: { identificationNumber: data.identificationNumber },
      });
      if (existingStudentPerson) {
        throw new ConflictException('Ya existe una persona con esa cédula de identidad');
      }

      // 2. Create student person
      const studentPerson = await tx.person.create({
        data: {
          profilePhoto: data.profilePhoto,
          firstNames: data.firstNames,
          lastNames: data.lastNames,
          identificationNumber: data.identificationNumber,
          birthDate: data.birthDate,
          gender: data.gender,
        },
      });

      // 3. Create student record
      const student = await tx.student.create({
        data: {
          personId: studentPerson.id,
          birthCountry: data.birthCountry,
          state: data.state,
          municipality: data.municipality,
          parish: data.parish,
          currentParish: data.currentParish,
          previousSchool: data.previousSchool,
          address: data.address,
          status: true,
          admissionDate: data.admissionDate,
        },
      });

      // 4. Resolve representative
      let representativeId: number;

      if (data.representativeMode === 'existing') {
        if (!data.existingRepresentativeId) {
          throw new BadRequestException('Debe seleccionar un representante existente');
        }
        const rep = await tx.representative.findUnique({
          where: { id: data.existingRepresentativeId },
        });
        if (!rep) {
          throw new NotFoundException('Representante no encontrado');
        }
        representativeId = rep.id;
      } else {
        // Validate rep CI uniqueness
        const existingRepPerson = await tx.person.findUnique({
          where: { identificationNumber: data.representativeIdentification },
        });
        if (existingRepPerson) {
          throw new ConflictException('Ya existe una persona con esa cédula de identidad para el representante');
        }

        // Create representative person
        const repPerson = await tx.person.create({
          data: {
            firstNames: data.representativeFirstNames!,
            lastNames: data.representativeLastNames!,
            identificationNumber: data.representativeIdentification!,
            birthDate: data.representativeBirthDate!,
            gender: data.representativeGender,
          },
        });

        // Find role
        const role = await tx.role.findUnique({ where: { role: 'Representante' } });
        if (!role) {
          throw new BadRequestException('Rol de representante no encontrado');
        }

        // Create user
        const repUser = await tx.user.create({
          data: {
            personId: repPerson.id,
            roleId: role.id,
            email: data.representativeEmail!,
            password: hashedPassword,
            phone: data.representativePhone,
            status: true,
          },
        });

        // Create representative
        const representative = await tx.representative.create({
          data: {
            userId: repUser.id,
            occupation: data.representativeProfession,
          },
        });

        representativeId = representative.id;
      }

      // 5. Link student to representative
      await tx.studentRepresentative.create({
        data: {
          studentId: student.id,
          representativeId,
          relationship: data.representativeRelation,
          isPrimary: true,
        },
      });

      // 6. Create enrollment
      const enrollment = await tx.studentEnrollment.create({
        data: {
          studentId: student.id,
          schoolYearId: data.schoolYearId,
          sectionId: data.sectionId,
          enrollmentDate: data.enrollmentDate,
          status: false,
        },
      });

      return { student, enrollment };
    });

    return { success: true, message: 'Matrícula creada exitosamente', data: result };
  }
}
