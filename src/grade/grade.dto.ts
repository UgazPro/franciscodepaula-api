import { IsInt, IsNumber, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeItemDTO {
  @IsInt()
  studentId!: number;

  @IsInt()
  evaluationId!: number;

  @IsNumber()
  score!: number;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class SaveGradesDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeItemDTO)
  grades!: GradeItemDTO[];
}
