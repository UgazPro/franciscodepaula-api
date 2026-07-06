import { IsInt, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateEvaluationDTO {
  @IsInt()
  teachingGroupId!: number;

  @IsInt()
  periodId!: number;

  @IsInt()
  evaluationTypeId!: number;

  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsNumber()
  percentage!: number;

  @IsNumber()
  maxScore!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
