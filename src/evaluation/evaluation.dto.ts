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
