import { IsInt, IsOptional, IsString, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeItemDTO {
  @IsInt()
  studentId!: number;

  @IsInt()
  evaluationId!: number;

  @IsInt()
  @Min(0)
  @Max(20)
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
