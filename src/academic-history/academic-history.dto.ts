import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class CreateSchoolHistoryDTO {
  @IsInt()
  studentId!: number;

  @IsOptional()
  @IsInt()
  levelSubjectId?: number | null;

  @IsInt()
  schoolId!: number;
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
