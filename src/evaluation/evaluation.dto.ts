import { IsInt, IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class CreateEvaluationDTO {
  @IsInt()
  teachingGroupId!: number;

  @IsInt()
  periodId!: number;

  @IsString()
  evaluationType!: string;

  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  percentage!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateEvaluationDTO {
  @IsOptional()
  @IsString()
  evaluationType?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class AutoAdjustDTO {
  @IsInt()
  teachingGroupId!: number;

  @IsInt()
  periodId!: number;
}
