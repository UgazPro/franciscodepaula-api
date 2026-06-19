import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { Injectable } from '@nestjs/common';
import { PaymentDTO, PaymentMethodDTO, ExchangeDTO, FeeDTO, UpdateFeeDTO } from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private prismaService: PrismaService) {}

  async getPayments(filters?: {
    page?: number;
    take?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    exactDate?: string;
    feeId?: number;
    paymentMethodId?: number;
    studentSearch?: string;
    representativeSearch?: string;
    morosos?: boolean;
    studentId?: number;
    schoolYearId?: number;
  }) {
    try {
      const where: any = {};

      // Date filter
      if (filters?.exactDate) {
        const date = new Date(filters.exactDate);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        where.paymentDate = { gte: date, lt: nextDay };
      } else if (filters?.startDate || filters?.endDate) {
        where.paymentDate = {};
        if (filters.startDate) where.paymentDate.gte = new Date(filters.startDate);
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setDate(end.getDate() + 1);
          where.paymentDate.lt = end;
        }
      }

      // Payment method filter
      if (filters?.paymentMethodId) {
        where.paymentMethodId = filters.paymentMethodId;
      }

      // Conditions on studentFees.some
      const studentFeeConditions: any[] = [];

      if (filters?.feeId) {
        studentFeeConditions.push({ feeId: filters.feeId });
      }

      if (filters?.studentSearch) {
        studentFeeConditions.push({
          student: {
            person: {
              OR: [
                { firstNames: { contains: filters.studentSearch, mode: 'insensitive' as const } },
                { lastNames: { contains: filters.studentSearch, mode: 'insensitive' as const } },
                { identificationNumber: { contains: filters.studentSearch } },
              ],
            },
          },
        });
      }

      if (filters?.representativeSearch) {
        studentFeeConditions.push({
          student: {
            representatives: {
              some: {
                representative: {
                  user: {
                    person: {
                      OR: [
                        { firstNames: { contains: filters.representativeSearch, mode: 'insensitive' as const } },
                        { lastNames: { contains: filters.representativeSearch, mode: 'insensitive' as const } },
                        { identificationNumber: { contains: filters.representativeSearch } },
                      ],
                    },
                  },
                },
              },
            },
          },
        });
      }

      if (filters?.studentId) {
        studentFeeConditions.push({ studentId: filters.studentId });
      }

      if (filters?.schoolYearId) {
        studentFeeConditions.push({ fee: { schoolYearId: filters.schoolYearId } });
      }

      // Generic search (across student name, payer, reference, concept)
      if (filters?.search) {
        const s = filters.search;
        studentFeeConditions.push({
          OR: [
            {
              student: {
                person: {
                  OR: [
                    { firstNames: { contains: s, mode: 'insensitive' as const } },
                    { lastNames: { contains: s, mode: 'insensitive' as const } },
                    { identificationNumber: { contains: s } },
                  ],
                },
              },
            },
            { payerName: { contains: s, mode: 'insensitive' as const } },
            { payerIdentification: { contains: s } },
            { reference: { contains: s } },
            {
              fee: {
                name: { contains: s, mode: 'insensitive' as const },
              },
            },
          ],
        });
      }

      if (filters?.morosos) {
        const now = new Date();
        const activeEnrollments = await this.prismaService.studentEnrollment.findMany({
          where: { status: true },
          include: {
            student: {
              include: {
                studentFees: {
                  where: { status: true },
                  select: { feeId: true },
                },
              },
            },
            schoolYear: {
              include: {
                fees: {
                  where: {
                    name: { not: 'Inscripción' },
                    endAt: { lt: now },
                  },
                },
              },
            },
          },
        });

        const morosoStudentIds = activeEnrollments
          .filter((se) => {
            const paidFeeIds = se.student.studentFees.map((sf) => sf.feeId);
            return se.schoolYear.fees.some((fee) => !paidFeeIds.includes(fee.id));
          })
          .map((se) => se.studentId);

        studentFeeConditions.push({ studentId: { in: morosoStudentIds } });
      }

      if (studentFeeConditions.length > 0) {
        where.studentFees = { some: { AND: studentFeeConditions } };
      }

      const include = {
        paymentMethod: true,
        exchange: true,
        studentFees: {
          include: {
            student: {
              include: {
                person: true,
              },
            },
            fee: true,
          },
        },
      };

      // If pagination params provided, use skip/take + count
      if (filters?.page !== undefined && filters?.take !== undefined) {
        const { page, take } = filters;
        const skip = (page - 1) * take;

        const [data, totalCount] = await Promise.all([
          this.prismaService.payment.findMany({
            where,
            include,
            skip,
            take,
            orderBy: { id: 'desc' },
          }),
          this.prismaService.payment.count({ where }),
        ]);

        return {
          data,
          meta: {
            page,
            take,
            totalCount,
            totalPages: Math.ceil(totalCount / take),
            hasNext: page < Math.ceil(totalCount / take),
            hasPrev: page > 1,
          },
        };
      }

      // No pagination → return all (backwards compatible)
      const payments = await this.prismaService.payment.findMany({
        where,
        include,
        orderBy: { id: 'desc' },
      });

      return payments;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getStudentsWithDebts() {
    try {
      const students = await this.prismaService.student.findMany({
        where: { status: true },
        include: {
          person: true,
          enrollments: {
            include: {
              schoolYear: {
                include: {
                  fees: true,
                },
              },
              section: {
                include: {
                  highSchoolLevel: true,
                },
              },
            },
          },
          representatives: {
            include: {
              representative: {
                include: {
                  user: {
                    include: {
                      person: true,
                    },
                  },
                },
              },
            },
          },
          studentFees: {
            select: { feeId: true },
          },
        },
        orderBy: { id: 'asc' },
      });

      const result = students
        .filter((student) => {
          const allFeeIds = new Set<number>();
          for (const enrollment of student.enrollments) {
            for (const fee of enrollment.schoolYear.fees) {
              allFeeIds.add(fee.id);
            }
          }

          if (allFeeIds.size === 0) return false;

          const paidFeeIds = new Set(student.studentFees.map((sf) => sf.feeId));

          for (const feeId of allFeeIds) {
            if (!paidFeeIds.has(feeId)) return true;
          }

          return false;
        })
        .map((student) => ({
          ...student,
          paidFeeIds: [
            ...new Set(student.studentFees.map((sf) => sf.feeId)),
          ],
          studentFees: undefined,
        }));

      return result;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getPaymentById(id: number) {
    try {
      const payment = await this.prismaService.payment.findUnique({
        where: { id },
        include: {
          studentFees: {
            include: {
              student: {
                include: {
                  person: true,
                },
              },
              fee: true,
            },
          },
        },
      });

      return payment;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  private async processStudentFees(
    tx: any,
    paymentId: number,
    items: { studentId: number; feeId: number }[],
  ) {
    for (const item of items) {
      const feeInfo = await tx.fee.findUnique({
        where: { id: item.feeId },
      });

      if (!feeInfo) {
        badResponse.message = `Tipo de pago ID ${item.feeId} no encontrado.`;
        throw new Error(badResponse.message);
      }

      // Handle enrollment logic
      if (feeInfo.name === "Inscripción") {
        const enrollment = await tx.studentEnrollment.findFirst({
          where: {
            studentId: item.studentId,
            schoolYearId: feeInfo.schoolYearId,
          },
        });

        if (enrollment) {
          await tx.studentEnrollment.update({
            where: { id: enrollment.id },
            data: { status: true },
          });
        }
      } else {
        const activeEnrollment = await tx.studentEnrollment.findFirst({
          where: {
            studentId: item.studentId,
            schoolYearId: feeInfo.schoolYearId,
            status: true,
          },
        });

        if (!activeEnrollment) {
          badResponse.message = `El estudiante ID ${item.studentId} no tiene una inscripción activa. Debe registrar el pago de inscripción primero.`;
          throw new Error(badResponse.message);
        }
      }

      // Create StudentFee with status = false (abono / partial payment marker)
      await tx.studentFee.create({
        data: {
          studentId: item.studentId,
          feeId: item.feeId,
          paymentId,
          status: false,
        },
      });
    }
  }

  async createPayment(data: PaymentDTO) {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            paymentMethodId: data.paymentMethodId,
            exchangeId: data.exchangeId,
            currency: data.currency,
            totalAmount: data.totalAmount,
            reference: data.reference,
            payerName: data.payerName,
            payerIdentification: data.payerIdentification,
            payerPhone: data.payerPhone,
            description: data.description,
            status: data.status,
            paymentDate: data.paymentDate,
          },
        });

        // Determine which student-fee pairs to process
        if (data.studentFees && data.studentFees.length > 0) {
          await this.processStudentFees(tx, payment.id, data.studentFees);
        } else if (data.studentId && data.feeId) {
          // Legacy: single student + single fee
          await this.processStudentFees(tx, payment.id, [
            { studentId: data.studentId, feeId: data.feeId },
          ]);
        }

        return payment;
      });

      return { success: true, message: 'Pago registrado exitosamente', data: result };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // PAYMENT METHODS
  /////////////////////////////////////////////////

  async getPaymentMethods() {
    try {
      const methods = await this.prismaService.paymentMethod.findMany();
      return methods;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getPaymentMethod(id: number) {
    try {
      const method = await this.prismaService.paymentMethod.findUnique({
        where: { id },
      });
      return method;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createPaymentMethod(data: PaymentMethodDTO) {
    try {
      const method = await this.prismaService.paymentMethod.create({
        data: {
          type: data.type,
          bank: data.bank,
          accountNumber: data.accountNumber,
          identification: data.identification,
          email: data.email,
          phone: data.phone,
          owner: data.owner,
          active: data.active,
        },
      });
      return { success: true, message: 'Método de pago creado exitosamente', data: method };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updatePaymentMethod(id: number, data: PaymentMethodDTO) {
    try {
      const method = await this.prismaService.paymentMethod.update({
        where: { id },
        data: {
          type: data.type,
          bank: data.bank,
          accountNumber: data.accountNumber,
          identification: data.identification,
          email: data.email,
          phone: data.phone,
          owner: data.owner,
          active: data.active,
        },
      });
      return { success: true, message: 'Método de pago actualizado exitosamente', data: method };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // EXCHANGE
  /////////////////////////////////////////////////

  async getExchangeRates() {
    try {
      const rates = await this.prismaService.exchange.findFirst({
        orderBy: { id: 'desc' },
      });
      return rates;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createExchange(data: ExchangeDTO) {
    try {
      const exchange = await this.prismaService.exchange.create({
        data: {
          rate: data.rate,
          date: data.date,
        },
      });
      return { success: true, message: 'Tasa de cambio registrada exitosamente', data: exchange };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // FEES
  /////////////////////////////////////////////////

  async getFees(schoolYearId?: number) {
    try {
      const where: any = {};
      if (schoolYearId) where.schoolYearId = schoolYearId;

      const fees = await this.prismaService.fee.findMany({
        where,
        include: {
          schoolYear: true,
        },
        orderBy: { id: 'asc' },
      });
      return fees;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async getFeeById(id: number) {
    try {
      const fee = await this.prismaService.fee.findUnique({
        where: { id },
        include: { schoolYear: true },
      });
      return fee;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createFee(data: FeeDTO) {
    try {
      const existing = await this.prismaService.fee.findFirst({
        where: {
          name: data.name,
          schoolYearId: data.schoolYearId,
        },
      });

      if (existing) {
        return {
          success: false,
          message: `Ya existe un pago de "${data.name}" para este año escolar. Puedes editarlo en lugar de crearlo.`,
        };
      }

      const fee = await this.prismaService.fee.create({
        data: {
          name: data.name,
          schoolYearId: data.schoolYearId,
          value: data.value,
          createdAt: data.createdAt ?? new Date(),
          startAt: data.startAt,
          endAt: data.endAt,
        },
      });
      return { success: true, message: 'Tipo de pago creado exitosamente', data: fee };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updateFee(id: number, data: UpdateFeeDTO) {
    try {
      if (data.name) {
        const current = await this.prismaService.fee.findUnique({ where: { id } });
        if (current) {
          const existing = await this.prismaService.fee.findFirst({
            where: {
              name: data.name,
              schoolYearId: current.schoolYearId,
              id: { not: id },
            },
          });
          if (existing) {
            return {
              success: false,
              message: `Ya existe un pago de "${data.name}" para este año escolar.`,
            };
          }
        }
      }

      const fee = await this.prismaService.fee.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.startAt !== undefined && { startAt: data.startAt }),
          ...(data.endAt !== undefined && { endAt: data.endAt }),
        },
      });
      return { success: true, message: 'Tipo de pago actualizado exitosamente', data: fee };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async deleteFee(id: number) {
    try {
      const fee = await this.prismaService.fee.findUnique({
        where: { id },
        include: { studentFees: { take: 1 } },
      });

      if (!fee) {
        return { success: false, message: 'El concepto de pago no existe' };
      }

      if (fee.studentFees.length > 0) {
        return {
          success: false,
          message: `No se puede eliminar "${fee.name}" porque ya tiene pagos registrados asociados`,
        };
      }

      await this.prismaService.fee.delete({ where: { id } });
      return { success: true, message: 'Concepto de pago eliminado exitosamente' };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // PAYMENTS
  /////////////////////////////////////////////////

  async deletePayment(id: number) {
    try {
      const payment = await this.prismaService.payment.findUnique({
        where: { id },
        include: { studentFees: true },
      });

      if (!payment) return badResponse;

      await this.prismaService.$transaction(async (tx) => {
        await tx.studentFee.deleteMany({ where: { paymentId: id } });
        await tx.payment.delete({ where: { id } });
      });

      return { success: true, message: 'Pago eliminado exitosamente' };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async updatePayment(id: number, data: PaymentDTO) {
    try {
      const payment = await this.prismaService.$transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id },
          data: {
            paymentMethodId: data.paymentMethodId,
            exchangeId: data.exchangeId,
            currency: data.currency,
            totalAmount: data.totalAmount,
            reference: data.reference,
            payerName: data.payerName,
            payerIdentification: data.payerIdentification,
            payerPhone: data.payerPhone,
            description: data.description,
            status: data.status,
          },
        });

        // Rebuild studentFees if provided
        const items = data.studentFees && data.studentFees.length > 0
          ? data.studentFees
          : (data.studentId && data.feeId
              ? [{ studentId: data.studentId, feeId: data.feeId }]
              : null);

        if (items) {
          await tx.studentFee.deleteMany({ where: { paymentId: id } });
          await this.processStudentFees(tx, id, items);
        }

        return tx.payment.findUnique({
          where: { id },
          include: {
            paymentMethod: true,
            exchange: true,
            studentFees: {
              include: {
                student: { include: { person: true } },
                fee: true,
              },
            },
          },
        });
      });

      return { success: true, message: 'Pago actualizado exitosamente', data: payment };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
