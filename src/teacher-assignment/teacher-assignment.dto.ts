import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateTeacherAssignmentDTO {
  @IsInt()
  teacherId!: number;

  @IsInt()
  levelSubjectId!: number;

  @IsInt()
  schoolYearId!: number;

  @IsOptional()
  @IsInt()
  sectionId?: number;
}

export class UpdateTeacherAssignmentDTO {
  @IsOptional()
  @IsInt()
  teacherId?: number;

  @IsOptional()
  @IsInt()
  levelSubjectId?: number;

  @IsOptional()
  @IsInt()
  schoolYearId?: number;

  @IsOptional()
  @IsInt()
  sectionId?: number;
}

export class CreateSpecialGroupDTO {
  @IsInt()
  teacherId!: number;

  @IsInt()
  levelSubjectId!: number;

  @IsInt()
  schoolYearId!: number;

  @IsString()
  groupName!: string;
}

export class UpdateSpecialGroupDTO {
  @IsOptional()
  @IsInt()
  teacherId?: number;

  @IsOptional()
  @IsInt()
  levelSubjectId?: number;

  @IsOptional()
  @IsInt()
  schoolYearId?: number;

  @IsOptional()
  @IsString()
  groupName?: string;
}

export class AddStudentsToSpecialGroupDTO {
  @IsArray()
  @IsInt({ each: true })
  studentEnrollmentIds!: number[];
}
