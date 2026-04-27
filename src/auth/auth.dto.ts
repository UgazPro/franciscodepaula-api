import { DtoBaseResponse } from '@/utilities/base.dto';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class ResponseLogin extends DtoBaseResponse {
  token!: string;
}
