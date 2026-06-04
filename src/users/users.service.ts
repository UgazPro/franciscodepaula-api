import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { badResponse, baseResponse } from '../utilities/base.dto';
import {
  UserDTO,
  StudentDTO,
  EmployeeDTO,
  RepresentativeDTO,
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
  // GET ALL STUDENTS
  //////////////////////////////////////////////////
  async getStudents(
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

      const students = await this.prismaService.student.findMany({
        where,
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

  async searchRepresentatives(search?: string) {
    try {
      const where: any = {
        user: {
          role: { role: 'Representante' },
        },
      };

      if (search) {
        where.OR = [
          { user: { person: { firstNames: { contains: search, mode: 'insensitive' } } } },
          { user: { person: { lastNames: { contains: search, mode: 'insensitive' } } } },
          { user: { person: { identificationNumber: { contains: search, mode: 'insensitive' } } } },
        ];
      }

      const reps = await this.prismaService.representative.findMany({
        where,
        include: {
          user: {
            include: {
              person: true,
            },
          },
          _count: {
            select: { students: true },
          },
        },
        orderBy: { id: 'asc' },
        take: search ? 20 : 50,
      });

      return reps.map((r) => ({
        id: r.id,
        relationship: r.relationship,
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
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
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

      baseResponse.message = 'Usuario creado correctamente';
      return result;
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
        throw new ConflictException('Ya existe una persona con esa cédula de identidad');
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

      baseResponse.message = 'Estudiante creado correctamente';
      return result;
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

      baseResponse.data = result;
      baseResponse.message = 'Estudiante actualizado correctamente';
      return baseResponse;
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

      baseResponse.message = 'Empleado creado correctamente';
      return result;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CREATE REPRESENTATIVE
  //////////////////////////////////////////////////
  async createRepresentative(data: RepresentativeDTO) {
    try {
      const passwordSource = data.studentIdentification || data.identificationNumber;
      const hashedPassword = await bcrypt.hash(passwordSource, 10);

      const result = await this.prismaService.$transaction(async (tx) => {
        const role = await tx.role.findUnique({
          where: { role: 'Representante' },
        });

        if (!role) {
          badResponse.message = 'Rol de representante no encontrado';
          return badResponse;
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
            relationship: data.relationship,
            occupation: data.occupation,
          },
        });

        return representative;
      });

      baseResponse.message = 'Representante creado correctamente';
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }

  async updateRepresentative(id: number, data: RepresentativeDTO) {
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
          relationship: data.relationship,
          occupation: data.occupation,
        },
      });

      baseResponse.message = 'Representante actualizado correctamente';
      return updated;
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

      baseResponse.message = 'Contraseña actualizada correctamente';
      return baseResponse;
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

      baseResponse.message = 'Usuario eliminado correctamente';
      return baseResponse;
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

      baseResponse.message = 'Estudiante eliminado correctamente';
      return baseResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }
}
