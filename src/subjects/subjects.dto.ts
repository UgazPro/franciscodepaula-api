import { IsOptional, IsString } from 'class-validator';

export class CreateSubjectDTO {
  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class UpdateSubjectDTO {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
