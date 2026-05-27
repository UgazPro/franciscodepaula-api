import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class EnrollmentDTO {
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
