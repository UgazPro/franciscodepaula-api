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
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('JWT_SECRET_KEY') as string;
  }

  async login(credentials: LoginDto) {
    try {
      const findUser = await this.prismaService.user.findUnique({
        where: { email: credentials.email },
        include: {
          userRoles: { include: { role: true } },
          person: true,
        },
      });

      if (!findUser) {
        badResponse.message = 'Usuario no registrado';
        return badResponse;
      }

      const isValid = await bcrypt.compare(
        credentials.password,
        findUser.password,
      );

      if (!isValid) {
        badResponse.message = 'Contraseña incorrecta';
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
