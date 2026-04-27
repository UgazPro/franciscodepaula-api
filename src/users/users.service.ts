import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { badResponse, baseResponse } from '../utilities/base.dto';
import { UserDTO, StudentDTO, EmployeeDTO, TeacherDTO, RepresentativeDTO, UserPassword, } from './users.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  //////////////////////////////////////////////////
  // GET ALL USERS
  //////////////////////////////////////////////////
  async getUsers() {
    try {
      const users = await this.prisma.user.findMany({
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
  // GET USER BY ID
  //////////////////////////////////////////////////
  async getUserById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          role: true,
          person: true,
          employee: {
            include: {
              teacher: true,
            },
          },
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

      const result = await this.prisma.$transaction(async (tx) => {
        //////////////////////////////////////////////////
        // 1. CREATE PERSON
        //////////////////////////////////////////////////
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

        //////////////////////////////////////////////////
        // 2. CREATE USER
        //////////////////////////////////////////////////
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

      baseResponse.message = 'User created successfully';
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
      const result = await this.prisma.$transaction(async (tx) => {
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
            parish: data.parish,
            previousSchool: data.previousSchool,
            address: data.address,
            status: data.status ?? 'active',
            admissionDate: data.admissionDate,
            sectionId: data.sectionId,
          },
        });

        return student;
      });

      baseResponse.message = 'Student created successfully';
      return result;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CREATE EMPLOYEE
  //////////////////////////////////////////////////
  async createEmployee(data: EmployeeDTO) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await this.prisma.$transaction(async (tx) => {
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
            salary: data.salary,
            hireDate: data.hireDate,
          },
        });

        return employee;
      });

      baseResponse.message = 'Employee created successfully';
      return result;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // CREATE TEACHER
  //////////////////////////////////////////////////
  async createTeacher(data: TeacherDTO) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const employee = await this.createEmployee(data);

        if (!employee || (employee as any).message) {
          throw new Error('Error creating employee');
        }

        const teacher = await tx.teacher.create({
          data: {
            employeeId: (employee as any).id,
          },
        });

        return teacher;
      });

      baseResponse.message = 'Teacher created successfully';
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
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await this.prisma.$transaction(async (tx) => {
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

        const representative = await tx.representative.create({
          data: {
            userId: user.id,
            relationship: data.relationship,
            occupation: data.occupation,
          },
        });

        return representative;
      });

      baseResponse.message = 'Representative created successfully';
      return result;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  //////////////////////////////////////////////////
  // UPDATE PASSWORD
  //////////////////////////////////////////////////
  async updatePassword(data: UserPassword) {
    try {
      const hashed = await bcrypt.hash(data.password, 10);

      await this.prisma.user.update({
        where: { id: data.id },
        data: { password: hashed },
      });

      baseResponse.message = 'Password updated successfully';
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
      await this.prisma.user.update({
        where: { id },
        data: {
          status: false,
        },
      });

      baseResponse.message = 'User disabled successfully';
      return baseResponse;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
