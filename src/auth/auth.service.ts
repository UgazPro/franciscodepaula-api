import { Injectable } from '@nestjs/common';
import { LoginDto, ResponseLogin } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { badResponse, baseResponse } from '@/utilities/base.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private secretKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('JWT_SECRET_KEY') as string;
  }

  async login(credentials: LoginDto) {
    try {
      const findUser = await this.prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          role: true,
          person: true,
        },
      });

      if (!findUser) {
        badResponse.message = 'Usuario o contraseña incorrectos';
        return badResponse;
      }

      const isValid = await bcrypt.compare(
        credentials.password,
        findUser.password,
      );
      if (!isValid) {
        badResponse.message = 'Usuario o contraseña incorrectos';
        return badResponse;
      }

      const { firstNames, lastNames } = findUser.person;
      baseResponse.message = `Bienvenido ${firstNames} ${lastNames}`;

      let { password, ...user } = findUser;

      const token = jwt.sign(user, this.secretKey, { expiresIn: '7d' });

      const responseLogin: ResponseLogin = {
        ...baseResponse,
        token,
      };

      return responseLogin;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      badResponse.message = message;
      return badResponse;
    }
  }
}
