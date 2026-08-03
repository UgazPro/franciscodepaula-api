import {
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GradeAdjustmentItemDTO {
  @IsInt()
  studentId!: number;

  @IsInt()
  teachingGroupId!: number;

  @IsInt()
  periodId!: number;

  @IsInt()
  @Min(0)
  @Max(20)
  adjustment!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsInt()
  createdBy?: number;
}

export class CreateGradeAdjustmentDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeAdjustmentItemDTO)
  adjustments!: GradeAdjustmentItemDTO[];
}
