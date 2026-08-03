import { IsInt, IsString, IsOptional, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSchoolHistoryDTO {
  @IsInt()
  studentId!: number;

  @IsOptional()
  @IsInt()
  levelSubjectId?: number | null;

  @IsInt()
  schoolId!: number;

  @IsOptional()
  @IsInt()
  schoolYearId?: number | null;

  @IsOptional()
  finalScore?: number | null;
}

export class CreateSchoolHistoryItemDTO {
  @IsInt()
  studentId!: number;

  @IsOptional()
  @IsInt()
  levelSubjectId?: number | null;

  @IsInt()
  schoolId!: number;

  @IsOptional()
  @IsInt()
  schoolYearId?: number | null;

  @IsOptional()
  finalScore?: number | null;
}

export class CreateSchoolHistoryBatchDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSchoolHistoryItemDTO)
  records!: CreateSchoolHistoryItemDTO[];
}

export class CreateFailedSubjectAttemptDTO {
  @IsOptional()
  score?: number;

  @IsOptional()
  evaluationDate?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsInt()
  createdBy?: number;
}

export class UpdateSchoolHistoryDTO {
  @IsOptional()
  @IsInt()
  schoolId?: number;

  @IsOptional()
  @IsInt()
  schoolYearId?: number | null;

  @IsOptional()
  finalScore?: number | null;
}

export class UpdateSchoolHistoryItemDTO {
  @IsInt()
  id!: number;

  @IsOptional()
  @IsInt()
  schoolId?: number;

  @IsOptional()
  @IsInt()
  schoolYearId?: number | null;

  @IsOptional()
  finalScore?: number | null;
}

export class UpdateSchoolHistoryBatchDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSchoolHistoryItemDTO)
  updates!: UpdateSchoolHistoryItemDTO[];
}

export class CreateReviewDTO {
  @IsInt()
  studentId!: number;

  @IsInt()
  levelSubjectId!: number;

  @IsInt()
  sectionId!: number;

  @IsInt()
  schoolId!: number;

  @IsInt()
  schoolYearId!: number;

  @IsInt()
  @Min(0)
  finalScore!: number;
}
