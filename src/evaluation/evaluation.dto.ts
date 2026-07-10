import { IsInt, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

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
  percentage?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
