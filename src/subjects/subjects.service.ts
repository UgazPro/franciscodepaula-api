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

  //////////////////////////////////////////////////
  // LEVEL SUBJECTS (subject ↔ highSchoolLevel)
  //////////////////////////////////////////////////

  async getSubjectsByLevel(levelId: number) {
    try {
      const levelSubjects = await this.prisma.levelSubject.findMany({
        where: { highSchoolLevelId: levelId },
        include: { subject: true },
        orderBy: { subject: { subject: 'asc' } },
      });
      return levelSubjects.map((ls) => ls.subject);
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async assignSubjectToLevel(levelId: number, subjectId: number) {
    try {
      const level = await this.prisma.highSchoolLevel.findUnique({ where: { id: levelId } });
      if (!level) {
        badResponse.message = 'Nivel no encontrado.';
        return badResponse;
      }

      const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        badResponse.message = 'Materia no encontrada.';
        return badResponse;
      }

      const existing = await this.prisma.levelSubject.findUnique({
        where: { highSchoolLevelId_subjectId: { highSchoolLevelId: levelId, subjectId } },
      });
      if (existing) {
        badResponse.message = 'La materia ya está asignada a este nivel.';
        return badResponse;
      }

      const created = await this.prisma.levelSubject.create({
        data: { highSchoolLevelId: levelId, subjectId },
        include: { subject: true },
      });

      return { success: true, message: 'Materia asignada al nivel exitosamente', data: created };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async removeSubjectFromLevel(levelId: number, subjectId: number) {
    try {
      const existing = await this.prisma.levelSubject.findUnique({
        where: { highSchoolLevelId_subjectId: { highSchoolLevelId: levelId, subjectId } },
      });
      if (!existing) {
        badResponse.message = 'La materia no está asignada a este nivel.';
        return badResponse;
      }

      await this.prisma.levelSubject.delete({
        where: { highSchoolLevelId_subjectId: { highSchoolLevelId: levelId, subjectId } },
      });

      return { success: true, message: 'Materia removida del nivel exitosamente', data: null };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getAllLevelSubjects() {
    try {
      const levels = await this.prisma.highSchoolLevel.findMany({
        include: {
          levelSubjects: {
            include: { subject: true },
            orderBy: { subject: { subject: 'asc' } },
          },
        },
        orderBy: { level: 'asc' },
      });
      return levels;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
