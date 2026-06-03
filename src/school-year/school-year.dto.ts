import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class PeriodDTO {
  @IsString()
  period!: string;

  @IsDateString()
  startDate!: Date;

  @IsDateString()
  endDate!: Date;
}

export class SectionDTO {
  @IsInt()
  schoolYearId!: number;

  @IsInt()
  highSchoolLevelId!: number;

  @IsString()
  section!: string;
}

export class CreateSchoolYearDTO {
  @IsString()
  name!: string;

  @IsDateString()
  startDate!: Date;

  @IsDateString()
  endDate!: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeriodDTO)
  periods?: PeriodDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDTO)
  sections?: SectionDTO[];
}

export class UpdateSchoolYearDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class HighSchoolLevelDTO {
  @IsString()
  level!: string;
}
