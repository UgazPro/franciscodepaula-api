import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { badResponse, baseResponse } from '../utilities/base.dto';
import {
  UserDTO,
  StudentDTO,
  EmployeeDTO,
  CreateRepresentativeDTO,
  UpdateRepresentativeDTO,
  UserPassword,
} from './users.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  //////////////////////////////////////////////////
  // GET ALL USERS
  //////////////////////////////////////////////////
  async getUsers() {
    try {
      const users = await this.prismaService.user.findMany({
        include: {
          role: true,
          person: true,
          employee: true,
          representative: true,
        },
        orderBy: { id: 'asc' },
      });

      return users;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // GET ALL STUDENTS (paginated)
  //////////////////////////////////////////////////
  async getStudents(
    page?: number,
    take?: number,
    search?: string,
    view?: string,
    levelId?: number,
    section?: string,
    gender?: string,
    ageMin?: number,
    ageMax?: number,
    ageExact?: number,
  ) {
    try {
      let where: any = {};

      switch (view) {
        case 'all':
          where = {};
          break;
        case 'pending':
          where = {
            status: true,
            enrollments: { none: { status: true } },
          };
          break;
        case 'inactive':
          where = { status: false };
          break;
        case 'active':
        default:
          where = {
            status: true,
            enrollments: {
              some: { status: true, schoolYear: { isActive: true } },
            },
          };
          break;
      }

      // Gender filter
      if (gender) {
        if (!where.person) where.person = {};
        where.person.gender = gender;
      }

      // Search filter
      if (search) {
        const personSearch = {
          OR: [
            { firstNames: { contains: search, mode: 'insensitive' as const } },
            { lastNames: { contains: search, mode: 'insensitive' as const } },
            { identificationNumber: { contains: search } },
          ],
        };
        if (where.person) {
          where.person = { ...where.person, ...personSearch };
        } else {
          where.person = personSearch;
        }
      }

      // Age filter → birthDate range
      const today = new Date();
      const birthFilter: any = {};
      if (ageExact !== undefined) {
        const start = new Date(
          today.getFullYear() - ageExact - 1,
          today.getMonth(),
          today.getDate() + 1,
        );
        const end = new Date(
          today.getFullYear() - ageExact,
          today.getMonth(),
          today.getDate(),
        );
        birthFilter.gt = start;
        birthFilter.lte = end;
      } else {
        if (ageMax !== undefined) {
          birthFilter.gt = new Date(
            today.getFullYear() - ageMax - 1,
            today.getMonth(),
            today.getDate(),
          );
        }
        if (ageMin !== undefined) {
          birthFilter.lte = new Date(
            today.getFullYear() - ageMin,
            today.getMonth(),
            today.getDate(),
          );
        }
      }
      if (Object.keys(birthFilter).length) {
        if (!where.person) where.person = {};
        where.person.birthDate = birthFilter;
      }

      // Level / Section filters
      const enrollmentFilters: any = {};
      if (levelId !== undefined) {
        enrollmentFilters.section = { highSchoolLevelId: levelId };
      }
      if (section !== undefined) {
        enrollmentFilters.section = { ...enrollmentFilters.section, section };
      }
      if (Object.keys(enrollmentFilters).length) {
        if (!where.enrollments) {
          where.enrollments = { some: enrollmentFilters };
        } else if (where.enrollments.some) {
          Object.assign(where.enrollments.some, enrollmentFilters);
        } else {
          where.enrollments.some = enrollmentFilters;
        }
      }

      const include = {
        person: true,
        enrollments: {
          include: {
            section: {
              include: {
                highSchoolLevel: true,
              },
            },
          },
        },
        representatives: {
          include: {
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
        },
      };

      // If pagination params provided, use skip/take + count
      if (page !== undefined && take !== undefined) {
        const skip = (page - 1) * take;

        const [data, totalCount] = await Promise.all([
          this.prismaService.student.findMany({
            where,
            include,
            skip,
            take,
            orderBy: { id: 'asc' },
          }),
          this.prismaService.student.count({ where }),
        ]);

        return {
          data,
          meta: {
            page,
            take,
            totalCount,
            totalPages: Math.ceil(totalCount / take),
            hasNext: page < Math.ceil(totalCount / take),
            hasPrev: page > 1,
          },
        };
      }

      // No pagination → return all (backwards compatible)
      const students = await this.prismaService.student.findMany({
        where,
        include,
        orderBy: { id: 'asc' },
      });

      return students;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CHECK IDENTIFICATION NUMBER UNIQUENESS
  //////////////////////////////////////////////////
  async checkIdentification(value: string, excludePersonId?: number) {
    try {
      const where: any = { identificationNumber: value };
      if (excludePersonId !== undefined) {
        where.id = { not: excludePersonId };
      }
      const existing = await this.prismaService.person.findFirst({ where });
      return { exists: !!existing };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }

  async searchRepresentatives(
    page?: number,
    take?: number,
    search?: string,
    view?: string,
    minStudents?: number,
  ) {
    try {
      const baseWhere: any = {
        user: {
          role: { role: 'Representante' },
        },
      };

      if (view === 'active') {
        baseWhere.user.status = true;
      }

      if (search) {
        baseWhere.user.person = {
          OR: [
            { firstNames: { contains: search, mode: 'insensitive' as const } },
            { lastNames: { contains: search, mode: 'insensitive' as const } },
            { identificationNumber: { contains: search } },
          ],
        };
      }

      // minStudents filter: get qualifying rep IDs first
      let repIdFilter: number[] | undefined;
      if (minStudents !== undefined) {
        const repsWithCount = await this.prismaService.representative.findMany({
          where: baseWhere,
          select: { id: true, _count: { select: { students: true } } },
        });
        repIdFilter = repsWithCount
          .filter((r) => r._count.students >= minStudents)
          .map((r) => r.id);

        const whereForCount = { id: { in: repIdFilter }, user: { role: { role: 'Representante' } } };

        if (page !== undefined && take !== undefined) {
          const totalCount = repIdFilter.length;
          if (totalCount === 0) {
            return { data: [], meta: { page, take, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false } };
          }

          const skip = (page - 1) * take;
          const reps = await this.prismaService.representative.findMany({
            where: whereForCount,
            include: {
              user: { include: { person: true } },
              _count: { select: { students: true } },
            },
            skip,
            take,
            orderBy: { id: 'asc' },
          });

          return {
            data: reps.map((r) => this.formatRep(r)),
            meta: {
              page,
              take,
              totalCount,
              totalPages: Math.ceil(totalCount / take),
              hasNext: page < Math.ceil(totalCount / take),
              hasPrev: page > 1,
            },
          };
        }

        // Backwards compatible without pagination
        const reps = await this.prismaService.representative.findMany({
          where: whereForCount,
          include: {
            user: { include: { person: true } },
            _count: { select: { students: true } },
          },
          orderBy: { id: 'asc' },
          take: search ? 20 : 200,
        });

        return reps.map((r) => this.formatRep(r));
      }

      // No minStudents filter
      if (page !== undefined && take !== undefined) {
        const skip = (page - 1) * take;
        const [reps, totalCount] = await Promise.all([
          this.prismaService.representative.findMany({
            where: baseWhere,
            include: {
              user: { include: { person: true } },
              _count: { select: { students: true } },
            },
            skip,
            take,
            orderBy: { id: 'asc' },
          }),
          this.prismaService.representative.count({ where: baseWhere }),
        ]);

        return {
          data: reps.map((r) => this.formatRep(r)),
          meta: {
            page,
            take,
            totalCount,
            totalPages: Math.ceil(totalCount / take),
            hasNext: page < Math.ceil(totalCount / take),
            hasPrev: page > 1,
          },
        };
      }

      // Backwards compatible: return all
      const reps = await this.prismaService.representative.findMany({
        where: baseWhere,
        include: {
          user: { include: { person: true } },
          _count: { select: { students: true } },
        },
        orderBy: { id: 'asc' },
        take: search ? 20 : 200,
      });

      return reps.map((r) => this.formatRep(r));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }

  private formatRep(r: any) {
    return {
      id: r.id,
      occupation: r.occupation,
      email: r.user.email,
      phone: r.user.phone,
      person: {
        id: r.user.person.id,
        firstNames: r.user.person.firstNames,
        lastNames: r.user.person.lastNames,
        identificationNumber: r.user.person.identificationNumber,
      },
      studentCount: r._count.students,
      status: r.user.status,
    };
  }

  //////////////////////////////////////////////////
  // SEARCH PERSONS (global search for header)
  //////////////////////////////////////////////////
  async searchPersons(q: string) {
    try {
      if (!q || q.length < 2) return [];

      const trimmed = q.trim();
      if (!trimmed) return [];

      const persons = await this.prismaService.person.findMany({
        include: {
          student: true,
          user: {
            include: {
              role: true,
              employee: true,
              representative: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      // Accent-insensitive post-filter
      const normalizedQuery = trimmed
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return persons
        .filter((person) => {
          const fullName = `${person.firstNames ?? ''} ${person.lastNames ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
          const id = (person.identificationNumber ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
          return fullName.includes(normalizedQuery) || id.includes(normalizedQuery);
        })
        .slice(0, 20)
        .map((person) => {
          if (person.student) {
            return {
              id: person.student.id,
              type: 'student',
              studentStatus: person.student.status,
              person: {
                id: person.id,
                firstNames: person.firstNames,
                lastNames: person.lastNames,
                identificationNumber: person.identificationNumber,
                profilePhoto: person.profilePhoto,
              },
              role: undefined,
            };
          }

          if (person.user) {
            return {
              id: person.user.id,
              type: person.user.employee ? 'employee' : 'representative',
              person: {
                id: person.id,
                firstNames: person.firstNames,
                lastNames: person.lastNames,
                identificationNumber: person.identificationNumber,
                profilePhoto: person.profilePhoto,
              },
              role: person.user.role.role,
            };
          }

          return null;
        })
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  //////////////////////////////////////////////////
  // GET STAFF (employees with person & role)
  //////////////////////////////////////////////////
  async getStaff() {
    try {
      const staff = await this.prismaService.user.findMany({
        where: {
          employee: { isNot: null },
        },
        include: {
          person: true,
          role: true,
          employee: true,
        },
        orderBy: { id: 'asc' },
      });

      return staff;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // GET USER BY ID
  //////////////////////////////////////////////////
  async getUserById(id: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
        include: {
          role: true,
          person: true,
          employee: true,
          representative: true,
        },
      });

      if (!user) {
        badResponse.message = 'User not found';
        return badResponse;
      }

      return user;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CREATE USER (CORE METHOD)
  //////////////////////////////////////////////////
  async createUser(data: UserDTO) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await this.prismaService.$transaction(async (tx) => {
        const person = await tx.person.create({
          data: {
            profilePhoto: data.profilePhoto,
            firstNames: data.firstNames,
            lastNames: data.lastNames,
            identificationNumber: data.identificationNumber,
            birthDate: data.birthDate,
            gender: data.gender,
          },
        });

        const user = await tx.user.create({
          data: {
            personId: person.id,
            roleId: data.roleId,
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            status: data.status ?? true,
          },
        });

        return user;
      });

      return { success: true, message: 'Usuario creado exitosamente', data: result };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CREATE STUDENT
  //////////////////////////////////////////////////
  async createStudent(data: StudentDTO) {
    try {
      const existingPerson = await this.prismaService.person.findUnique({
        where: { identificationNumber: data.identificationNumber },
      });

      if (existingPerson) {
        return { success: false, message: `La cédula "${data.identificationNumber}" ya está registrada por otro estudiante o usuario`, data: null };
      }

      const result = await this.prismaService.$transaction(async (tx) => {
        const person = await tx.person.create({
          data: {
            profilePhoto: data.profilePhoto,
            firstNames: data.firstNames,
            lastNames: data.lastNames,
            identificationNumber: data.identificationNumber,
            birthDate: data.birthDate,
            gender: data.gender,
          },
        });

        const student = await tx.student.create({
          data: {
            personId: person.id,
            birthCountry: data.birthCountry,
            state: data.state,
            municipality: data.municipality,
            parish: data.parish,
            currentParish: data.currentParish,
            previousSchool: data.previousSchool,
            address: data.address,
            status: data.status ?? true,
            admissionDate: data.admissionDate,
          },
        });

        return student;
      });

      return { success: true, message: 'Estudiante creado exitosamente', data: result };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(String(error));
    }
  }

  async updateStudent(id: number, data: StudentDTO) {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const student = await tx.student.findUnique({
          where: { id },
          include: {
            person: true,
          },
        });

        if (!student) {
          throw new Error('Estudiante no encontrado');
        }

        // Check identification number uniqueness (exclude current person)
        const duplicate = await this.prismaService.person.findFirst({
          where: {
            identificationNumber: data.identificationNumber,
            id: { not: student.personId },
          },
        });
        if (duplicate) {
          throw new Error(
            `La cédula "${data.identificationNumber}" ya está registrada por otro estudiante o usuario`,
          );
        }

        await tx.person.update({
          where: { id: student.personId },
          data: {
            profilePhoto: data.profilePhoto,
            firstNames: data.firstNames,
            lastNames: data.lastNames,
            identificationNumber: data.identificationNumber,
            birthDate: data.birthDate,
            gender: data.gender,
          },
        });

        await tx.student.update({
          where: { id },
          data: {
            birthCountry: data.birthCountry,
            state: data.state,
            municipality: data.municipality,
            parish: data.parish,
            currentParish: data.currentParish,
            previousSchool: data.previousSchool,
            address: data.address,
            status: data.status,
            admissionDate: data.admissionDate,
          },
        });

        return tx.student.findUnique({
          where: { id },
          include: {
            person: true,
          },
        });
      });

      return { success: true, message: 'Estudiante actualizado exitosamente', data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CREATE EMPLOYEE
  //////////////////////////////////////////////////
  async createEmployee(data: EmployeeDTO) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await this.prismaService.$transaction(async (tx) => {
        const person = await tx.person.create({
          data: {
            profilePhoto: data.profilePhoto,
            firstNames: data.firstNames,
            lastNames: data.lastNames,
            identificationNumber: data.identificationNumber,
            birthDate: data.birthDate,
            gender: data.gender,
          },
        });

        const user = await tx.user.create({
          data: {
            personId: person.id,
            roleId: data.roleId,
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            status: data.status ?? true,
          },
        });

        const employee = await tx.employee.create({
          data: {
            userId: user.id,
            baseHourRate: data.baseHourRate,
            hireDate: data.hireDate,
          },
        });

        return employee;
      });

      return { success: true, message: 'Empleado creado exitosamente', data: result };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CREATE REPRESENTATIVE (must link to a student)
  //////////////////////////////////////////////////
  async createRepresentative(data: CreateRepresentativeDTO) {
    try {
      const hashedPassword = await bcrypt.hash(data.identificationNumber, 10);

      const result = await this.prismaService.$transaction(async (tx) => {
        // Verify student exists
        const student = await tx.student.findUnique({
          where: { id: data.studentId },
          include: { representatives: { include: { representative: true } } },
        });
        if (!student) {
          throw new BadRequestException('Estudiante no encontrado');
        }

        const role = await tx.role.findUnique({
          where: { role: 'Representante' },
        });
        if (!role) {
          throw new BadRequestException('Rol de representante no encontrado');
        }

        const person = await tx.person.create({
          data: {
            profilePhoto: data.profilePhoto,
            firstNames: data.firstNames,
            lastNames: data.lastNames,
            identificationNumber: data.identificationNumber,
            birthDate: data.birthDate,
            gender: data.gender,
          },
        });

        const user = await tx.user.create({
          data: {
            personId: person.id,
            roleId: role.id,
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            status: true,
          },
        });

        const representative = await tx.representative.create({
          data: {
            userId: user.id,
            occupation: data.occupation,
          },
        });

        // Determine isPrimary: true only if student has no primary rep yet
        const hasPrimary = student.representatives.some((sr) => sr.isPrimary === true);
        await tx.studentRepresentative.create({
          data: {
            studentId: data.studentId,
            representativeId: representative.id,
            relationship: data.relationship,
            isPrimary: !hasPrimary,
          },
        });

        return representative;
      });

      return { success: true, message: 'Representante creado exitosamente', data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }

  async updateRepresentative(id: number, data: UpdateRepresentativeDTO) {
    try {
      const rep = await this.prismaService.representative.findUnique({
        where: { id },
        include: { user: { include: { person: true } } },
      });

      if (!rep) {
        badResponse.message = 'Representante no encontrado';
        return badResponse;
      }

      // Check identification number uniqueness (exclude current person)
      const duplicate = await this.prismaService.person.findFirst({
        where: {
          identificationNumber: data.identificationNumber,
          id: { not: rep.user.personId },
        },
      });
      if (duplicate) {
        badResponse.message =
          `La cédula "${data.identificationNumber}" ya está registrada por otro estudiante o usuario`;
        return badResponse;
      }

      await this.prismaService.person.update({
        where: { id: rep.user.personId },
        data: {
          profilePhoto: data.profilePhoto,
          firstNames: data.firstNames,
          lastNames: data.lastNames,
          identificationNumber: data.identificationNumber,
          birthDate: data.birthDate,
          gender: data.gender,
        },
      });

      await this.prismaService.user.update({
        where: { id: rep.userId },
        data: {
          email: data.email,
          phone: data.phone,
        },
      });

      const updated = await this.prismaService.representative.update({
        where: { id },
        data: {
          occupation: data.occupation,
        },
      });

      return { success: true, message: 'Representante actualizado exitosamente', data: updated };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // UPDATE PASSWORD
  //////////////////////////////////////////////////
  async updatePassword(data: UserPassword) {
    try {
      const hashed = await bcrypt.hash(data.password, 10);

      await this.prismaService.user.update({
        where: { id: data.id },
        data: { password: hashed },
      });

      return { success: true, message: 'Contraseña actualizada exitosamente', data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // DELETE USER (SOFT DELETE STYLE)
  //////////////////////////////////////////////////
  async deleteUser(id: number) {
    try {
      await this.prismaService.user.update({
        where: { id },
        data: {
          status: false,
        },
      });

      return { success: true, message: 'Usuario eliminado exitosamente', data: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }

  async deleteStudent(id: number) {
    try {
      await this.prismaService.student.update({
        where: { id },
        data: {
          status: false,
        },
      });

      return { success: true, message: 'Estudiante eliminado exitosamente', data: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }
}
