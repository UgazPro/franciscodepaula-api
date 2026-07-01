import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
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

interface RepStudentEnrollment {
  section: {
    section: string;
    highSchoolLevel?: { level: string };
  } | null;
}

interface RepStudentItem {
  relationship: string | null;
  student: {
    id: number;
    status: boolean | null;
    person: {
      firstNames: string;
      lastNames: string;
      identificationNumber: string;
      birthDate: Date | null;
    };
    enrollments: RepStudentEnrollment[];
    _count: { studentFees: number };
  };
}

interface RepWithStudents {
  id: number;
  occupation: string | null;
  user: {
    email: string;
    phone: string | null;
    status: boolean | null;
    person: {
      id: number;
      firstNames: string;
      lastNames: string;
      identificationNumber: string;
      birthDate: Date;
    };
  };
  _count: { students: number };
  students: RepStudentItem[];
}

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
          userRoles: { include: { role: true } },
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
      let where: Prisma.StudentWhereInput = {};

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

      // Person-level filters (gender, search, age) — build as one object
      const personFilter: Prisma.PersonWhereInput = {};

      if (gender) {
        personFilter.gender = gender;
      }

      if (search) {
        personFilter.OR = [
          { firstNames: { contains: search, mode: 'insensitive' as const } },
          { lastNames: { contains: search, mode: 'insensitive' as const } },
          { identificationNumber: { contains: search } },
        ];
      }

      const today = new Date();
      const birthFilter: { gt?: Date; lte?: Date } = {};
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
        personFilter.birthDate = birthFilter;
      }

      if (Object.keys(personFilter).length) {
        where.person = personFilter;
      }

      // Level / Section filters
      const sectionFilter: Prisma.SectionWhereInput = {};
      if (levelId !== undefined) sectionFilter.highSchoolLevelId = levelId;
      if (section !== undefined) sectionFilter.section = section;

      if (Object.keys(sectionFilter).length) {
        const enrollmentFilter: Prisma.StudentEnrollmentWhereInput = {};
        enrollmentFilter.section = sectionFilter;

        if (!where.enrollments) {
          where.enrollments = { some: enrollmentFilter };
        } else if (where.enrollments.some) {
          Object.assign(where.enrollments.some, enrollmentFilter);
        } else {
          where.enrollments.some = enrollmentFilter;
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
      const where: Prisma.PersonWhereInput = { identificationNumber: value };
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
      const userFilter: Prisma.UserWhereInput = {
        userRoles: { some: { role: { role: 'Representante' } } },
      };

      if (view === 'active') {
        userFilter.status = true;
      }

      if (search) {
        userFilter.person = {
          OR: [
            { firstNames: { contains: search, mode: 'insensitive' as const } },
            { lastNames: { contains: search, mode: 'insensitive' as const } },
            { identificationNumber: { contains: search } },
          ],
        };
      }

      const baseWhere: Prisma.RepresentativeWhereInput = {
        user: userFilter,
      };

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

        const whereForCount = { id: { in: repIdFilter }, user: { userRoles: { some: { role: { role: 'Representante' } } } } };

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
              students: {
                include: {
                  student: {
                    include: {
                      person: true,
                      enrollments: {
                        include: { section: { include: { highSchoolLevel: true } } },
                        orderBy: { id: 'desc' },
                        take: 1,
                      },
                      _count: { select: { studentFees: true } },
                    },
                  },
                },
              },
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
            students: {
              include: {
                student: {
                  include: {
                    person: true,
                    enrollments: {
                      include: { section: true },
                      orderBy: { id: 'desc' },
                      take: 1,
                    },
                    _count: { select: { studentFees: true } },
                  },
                },
              },
            },
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
              students: {
                include: {
                  student: {
                    include: {
                      person: true,
                      enrollments: {
                        include: { section: { include: { highSchoolLevel: true } } },
                        orderBy: { id: 'desc' },
                        take: 1,
                      },
                      _count: { select: { studentFees: true } },
                    },
                  },
                },
              },
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
          students: {
            include: {
              student: {
                include: {
                  person: true,
                  enrollments: {
                    include: { section: true },
                    orderBy: { id: 'desc' },
                    take: 1,
                  },
                  _count: { select: { studentFees: true } },
                },
              },
            },
          },
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

  private formatRep(r: RepWithStudents) {
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
      students: (r.students ?? []).map((sr: RepStudentItem) => ({
        id: sr.student.id,
        firstNames: sr.student.person.firstNames,
        lastNames: sr.student.person.lastNames,
        identificationNumber: sr.student.person.identificationNumber,
        status: sr.student.status ?? false,
        section: (() => {
          const enrollment = sr.student.enrollments?.[0];
          return enrollment
            ? `${enrollment.section?.highSchoolLevel?.level ?? ""} - ${enrollment.section?.section ?? ""}`
            : null;
        })(),
        relationship: sr.relationship ?? null,
        birthDate: sr.student.person.birthDate ?? null,
        paymentCount: sr.student._count?.studentFees ?? 0,
      })),
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
              userRoles: { include: { role: true } },
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
              email: person.user?.email ?? null,
              phone: person.user?.phone ?? null,
              person: {
                id: person.id,
                firstNames: person.firstNames,
                lastNames: person.lastNames,
                identificationNumber: person.identificationNumber,
                profilePhoto: person.profilePhoto,
                birthDate: person.birthDate,
                gender: person.gender,
              },
              role: undefined,
            };
          }

          if (person.user) {
            return {
              id: person.user.id,
              type: person.user.employee ? 'employee' : 'representative',
              email: person.user.email ?? null,
              phone: person.user.phone ?? null,
              userStatus: person.user.status,
              occupation: person.user.representative?.occupation ?? null,
              person: {
                id: person.id,
                firstNames: person.firstNames,
                lastNames: person.lastNames,
                identificationNumber: person.identificationNumber,
                profilePhoto: person.profilePhoto,
                birthDate: person.birthDate,
                gender: person.gender,
              },
              role: person.user.userRoles[0]?.role.role,
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
          userRoles: { include: { role: true } },
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
  // GET TEACHERS (staff with role "Docente")
  //////////////////////////////////////////////////
  async getTeachers() {
    try {
      const teachers = await this.prismaService.user.findMany({
        where: {
          employee: { isNot: null },
          userRoles: { some: { role: { role: 'Docente' } } },
        },
        include: {
          person: true,
          userRoles: { include: { role: true } },
          employee: true,
        },
        orderBy: { id: 'asc' },
      });

      return teachers;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // GET ROLES
  //////////////////////////////////////////////////
  async getRoles() {
    try {
      const roles = await this.prismaService.role.findMany({
        orderBy: { id: 'asc' },
      });
      return roles;
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
          userRoles: { include: { role: true } },
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
  // GET STUDENT BY ID
  //////////////////////////////////////////////////
  async getStudentById(studentId: number) {
    try {
      const student = await this.prismaService.student.findUnique({
        where: { id: studentId },
        include: {
          person: {
            include: {
              user: {
                select: { email: true, phone: true },
              },
            },
          },
          enrollments: {
            include: {
              section: {
                include: {
                  highSchoolLevel: true,
                },
              },
            },
            orderBy: { id: 'desc' },
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
        },
      });

      if (!student) {
        return { success: false, message: 'Estudiante no encontrado' };
      }

      return { success: true, data: student };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // GET REPRESENTATIVE BY ID
  //////////////////////////////////////////////////
  async getRepresentativeById(userId: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          person: true,
          userRoles: { include: { role: true } },
          representative: {
            include: {
              students: {
                include: {
                  student: {
                    include: {
                      person: true,
                      enrollments: {
                        include: {
                          section: {
                            include: {
                              highSchoolLevel: true,
                            },
                          },
                        },
                        orderBy: { id: 'desc' },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || !user.representative) {
        return { success: false, message: 'Representante no encontrado' };
      }

      return { success: true, data: user };
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
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            status: data.status ?? true,
          },
        });

        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
          })),
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
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            status: data.status ?? true,
          },
        });

        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
          })),
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
  // UPDATE EMPLOYEE
  //////////////////////////////////////////////////
  async updateEmployee(id: number, data: EmployeeDTO) {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id },
          include: { person: true, employee: true },
        });
        if (!user) throw new BadRequestException('Usuario no encontrado');

        await tx.person.update({
          where: { id: user.personId },
          data: {
            profilePhoto: data.profilePhoto,
            firstNames: data.firstNames,
            lastNames: data.lastNames,
            identificationNumber: data.identificationNumber,
            birthDate: data.birthDate,
            gender: data.gender,
          },
        });

        const userData: Prisma.UserUpdateInput = {
          email: data.email,
          phone: data.phone,
        };
        if (data.password) {
          userData.password = await bcrypt.hash(data.password, 10);
        }
        await tx.user.update({ where: { id }, data: userData });

        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });

        if (user.employee) {
          await tx.employee.update({
            where: { id: user.employee.id },
            data: {
              baseHourRate: data.baseHourRate,
              hireDate: data.hireDate,
            },
          });
        }

        return { id };
      });

      return { success: true, message: 'Empleado actualizado exitosamente', data: result };
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
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            status: true,
          },
        });

        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
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
