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
