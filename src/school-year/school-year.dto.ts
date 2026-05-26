import { ArrayMinSize, IsArray, IsDateString, IsInt, IsString, ValidateNested } from "class-validator"

import { Type } from "class-transformer"

export class PeriodDTO {

    @IsString()
    period!: string

    @IsDateString()
    startDate!: Date

    @IsDateString()
    endDate!: Date

}

export class SectionDTO {

    @IsInt()
    highSchoolLevelId!: number

    @IsString()
    section!: string

}

export class SchoolYearDTO {

    @IsString()
    name!: string

    @IsDateString()
    startDate!: Date

    @IsDateString()
    endDate!: Date

    @IsArray()
    @ValidateNested({ each:true })
    @Type(()=>SchoolYearDTO)
    periods!: SchoolYearDTO[]

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each:true })
    @Type(()=>SectionDTO)
    sections!: SectionDTO[]

}

export class HighSchoolLevelDTO {

    @IsString()
    level!: string

}