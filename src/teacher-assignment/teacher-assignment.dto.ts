import { IsInt, IsOptional } from 'class-validator';

export class CreateTeacherAssignmentDTO {
  @IsInt()
  teacherId!: number;

  @IsInt()
  subjectId!: number;

  @IsInt()
  sectionId!: number;
}

export class UpdateTeacherAssignmentDTO {
  @IsOptional()
  @IsInt()
  teacherId?: number;

  @IsOptional()
  @IsInt()
  subjectId?: number;

  @IsOptional()
  @IsInt()
  sectionId?: number;
}
