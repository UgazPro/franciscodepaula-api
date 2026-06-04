import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class EnrollmentDTO {
  @IsOptional()
  @IsNumber()
  studentId!: number;

  @IsNumber()
  schoolYearId!: number;

  @IsNumber()
  sectionId!: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  enrollmentDate?: Date;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class StudentSectionDTO {
  @IsNumber()
  studentId!: number;

  @IsNumber()
  sectionId!: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  enrollmentDate?: Date;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class StudentRepresentativeDTO {
  @IsNumber()
  studentId!: number;

  @IsNumber()
  representativeId!: number;
}

export class FullEnrollmentDTO {
  // ── Student fields ──
  @IsString()
  firstNames!: string;

  @IsString()
  lastNames!: string;

  @IsString()
  identificationNumber!: string;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  birthDate!: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsString()
  birthCountry!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsString()
  parish?: string;

  @IsOptional()
  @IsString()
  currentParish?: string;

  @IsOptional()
  @IsString()
  previousSchool?: string;

  @IsString()
  address!: string;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  admissionDate!: Date;

  // ── Representative mode ──
  @IsString()
  representativeMode!: 'create' | 'existing';

  // For 'create' mode
  @IsOptional()
  @IsString()
  representativeFirstNames?: string;

  @IsOptional()
  @IsString()
  representativeLastNames?: string;

  @IsOptional()
  @IsString()
  representativeIdentification?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  representativeBirthDate?: Date;

  @IsOptional()
  @IsString()
  representativeGender?: string;

  @IsOptional()
  @IsString()
  representativeEmail?: string;

  @IsOptional()
  @IsString()
  representativePhone?: string;

  @IsOptional()
  @IsString()
  representativeRelation?: string;

  @IsOptional()
  @IsString()
  representativeProfession?: string;

  // For 'existing' mode
  @IsOptional()
  @IsNumber()
  existingRepresentativeId?: number;

  // ── Enrollment fields ──
  @IsNumber()
  schoolYearId!: number;

  @IsNumber()
  sectionId!: number;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  enrollmentDate!: Date;
}
