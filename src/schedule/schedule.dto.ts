import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateScheduleDTO {
  @IsInt()
  teachingGroupId!: number;

  @IsInt()
  scheduleSlotId!: number;

  @IsOptional()
  @IsString()
  classroom?: string;
}

export class CreateCRPScheduleDTO {
  @IsString()
  groupName!: string;

  @IsInt()
  scheduleSlotId!: number;

  @IsOptional()
  @IsString()
  classroom?: string;
}

export class AssignAllCRPDTO {
  @IsInt()
  scheduleSlotId!: number;

  @IsOptional()
  @IsString()
  classroom?: string;
}
