import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSubjectDTO, UpdateSubjectDTO } from './subjects.dto';
import { badResponse, baseResponse } from '@/utilities/base.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const subjects = await this.prisma.subject.findMany({
        orderBy: { subject: 'asc' },
      });
      return subjects;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async findOne(id: number) {
    try {
      const subject = await this.prisma.subject.findUnique({ where: { id } });
      if (!subject) {
        throw new NotFoundException('Materia no encontrada');
      }
      return subject;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async create(data: CreateSubjectDTO) {
    try {
      const existing = await this.prisma.subject.findFirst({
        where: { subject: data.subject },
      });

      if (existing) {
        badResponse.message = 'Ya existe una materia con ese nombre.';
        return badResponse;
      }

      const subject = await this.prisma.subject.create({
        data: {
          subject: data.subject,
          code: data.code ?? null,
          status: true,
        },
      });

      return { success: true, message: 'Materia creada exitosamente', data: subject };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async update(id: number, data: UpdateSubjectDTO) {
    try {
      const existing = await this.prisma.subject.findUnique({ where: { id } });
      if (!existing) {
        badResponse.message = 'Materia no encontrada.';
        return badResponse;
      }

      if (data.subject) {
        const duplicate = await this.prisma.subject.findFirst({
          where: { subject: data.subject, NOT: { id } },
        });
        if (duplicate) {
          badResponse.message = 'Ya existe otra materia con ese nombre.';
          return badResponse;
        }
      }

      const updated = await this.prisma.subject.update({
        where: { id },
        data: {
          ...(data.subject !== undefined && { subject: data.subject }),
          ...(data.code !== undefined && { code: data.code }),
        },
      });

      return { success: true, message: 'Materia actualizada exitosamente', data: updated };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async toggleStatus(id: number) {
    try {
      const existing = await this.prisma.subject.findUnique({ where: { id } });
      if (!existing) {
        badResponse.message = 'Materia no encontrada.';
        return badResponse;
      }

      const updated = await this.prisma.subject.update({
        where: { id },
        data: { status: !existing.status },
      });

      const msg = updated.status ? 'Materia activada exitosamente' : 'Materia desactivada exitosamente';
      return { success: true, message: msg, data: updated };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
