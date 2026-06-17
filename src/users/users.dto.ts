import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  IsBoolean,
  IsNumber,
  IsDate,
} from 'class-validator';
import { Transform } from 'class-transformer';

//////////////////////////////////////////////////
// PERSON DTO (MAIN DTO)
//////////////////////////////////////////////////
export class PersonDTO {
  @IsOptional()
  @IsString()
  profilePhoto!: string;

  @IsString()
  firstNames!: string;

  @IsString()
  lastNames!: string;

  @IsString()
  identificationNumber!: string;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  birthDate!: Date;

  @IsString()
  gender!: string;
}

//////////////////////////////////////////////////
// USER DTO
//////////////////////////////////////////////////
export class UserDTO extends PersonDTO {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsNumber()
  roleId!: number;

  @IsOptional()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsBoolean()
  status!: boolean;
}

//////////////////////////////////////////////////
// STUDENT DTO
//////////////////////////////////////////////////
export class StudentDTO extends PersonDTO {
  @IsOptional()
  @IsString()
  birthCountry!: string;

  @IsOptional()
  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  municipality!: string;

  @IsOptional()
  @IsString()
  parish!: string;

  @IsOptional()
  @IsString()
  currentParish!: string;

  @IsOptional()
  @IsString()
  previousSchool!: string;

  @IsOptional()
  @IsString()
  address!: string;

  @IsOptional()
  @IsBoolean()
  status!: boolean;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  admissionDate!: Date;

  @IsOptional()
  @IsNumber()
  sectionId?: number;
}

//////////////////////////////////////////////////
// CREATE REPRESENTATIVE DTO (requires student link)
//////////////////////////////////////////////////
export class CreateRepresentativeDTO extends PersonDTO {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  occupation!: string;

  @IsNumber()
  studentId!: number;

  @IsString()
  relationship!: string;
}

//////////////////////////////////////////////////
// UPDATE REPRESENTATIVE DTO (only person data)
//////////////////////////////////////////////////
export class UpdateRepresentativeDTO extends PersonDTO {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  occupation!: string;
}

//////////////////////////////////////////////////
// EMPLOYEE DTO
//////////////////////////////////////////////////
export class EmployeeDTO extends UserDTO {
  @IsOptional()
  @IsNumber()
  baseHourRate?: number;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  hireDate!: Date;
}

export class UserPassword {
  @IsNumber()
  id!: number;
  @IsString()
  password!: string;
}

// Interfaces
export interface UserTokenDecode {
  id: number;
  personId: number;
  roleId: number;
  email: string;
  phone: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  person: Person;
  iat: number;
  exp: number;
}

export interface Person {
  id: number;
  profilePhoto: string;
  firstNames: string;
  lastNames: string;
  identificationNumber: string;
  birthDate: Date;
  gender: string;
}

export interface Role {
  id: number;
  role: string;
}
