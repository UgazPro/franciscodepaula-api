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
  schoolYear?: number | null;

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
  schoolYear?: number | null;

  @IsOptional()
  finalScore?: number | null;
}

export class CreateSchoolHistoryBatchDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSchoolHistoryItemDTO)
  records!: CreateSchoolHistoryItemDTO[];
}

export class CreateFailedSubjectDTO {
  @IsInt()
  studentId!: number;

  @IsInt()
  levelSubjectId!: number;

  @IsOptional()
  date?: Date;

  @IsOptional()
  finalAverage?: number;

  @IsOptional()
  @IsString()
  typeOf?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateSchoolHistoryDTO {
  @IsOptional()
  @IsInt()
  schoolId?: number;

  @IsOptional()
  @IsInt()
  schoolYear?: number | null;

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
  schoolYear?: number | null;

  @IsOptional()
  finalScore?: number | null;
}

export class UpdateSchoolHistoryBatchDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSchoolHistoryItemDTO)
  updates!: UpdateSchoolHistoryItemDTO[];
}
