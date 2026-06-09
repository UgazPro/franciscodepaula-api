import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { Injectable } from '@nestjs/common';
import { PaymentDTO, PaymentMethodDTO, ExchangeDTO, FeeDTO } from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private prismaService: PrismaService) {}

  async getPayments(filters?: {
    startDate?: string;
    endDate?: string;
    exactDate?: string;
    feeId?: number;
    paymentMethodId?: number;
    studentSearch?: string;
    representativeSearch?: string;
    morosos?: boolean;
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
                { firstNames: { contains: filters.studentSearch, mode: 'insensitive' } },
                { lastNames: { contains: filters.studentSearch, mode: 'insensitive' } },
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
                        { firstNames: { contains: filters.representativeSearch, mode: 'insensitive' } },
                        { lastNames: { contains: filters.representativeSearch, mode: 'insensitive' } },
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

      const payments = await this.prismaService.payment.findMany({
        where,
        include: {
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
        },
        orderBy: { id: 'desc' },
      });

      return payments;
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

        // Create StudentFee linked directly to the payment
        let createdStudentFee;
        if (data.studentId && data.feeId) {
          createdStudentFee = await tx.studentFee.create({
            data: {
              studentId: data.studentId,
              feeId: data.feeId,
              paymentId: payment.id,
              status: true,
            },
          });
        }

        // Link enrollment if the fee is "Inscripción"
        if (data.studentId && createdStudentFee) {
          const feeInfo = await tx.fee.findUnique({
            where: { id: createdStudentFee.feeId },
          });

          if (!feeInfo) {
            throw new Error('Tipo de pago no encontrado.');
          }

          if (feeInfo.name === "Inscripción") {
            const enrollment = await tx.studentEnrollment.findFirst({
              where: {
                studentId: data.studentId,
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
            // Monthly fees require an active enrollment
            const activeEnrollment = await tx.studentEnrollment.findFirst({
              where: {
                studentId: data.studentId,
                schoolYearId: feeInfo.schoolYearId,
                status: true,
              },
            });

            if (!activeEnrollment) {
              throw new Error('El estudiante no tiene una inscripción activa. Debe registrar el pago de inscripción primero.');
            }
          }
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
      const rates = await this.prismaService.exchange.findMany({
        orderBy: { date: 'desc' },
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

  async getFees() {
    try {
      const fees = await this.prismaService.fee.findMany({
        include: {
          schoolYear: true,
        },
      });
      return fees;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createFee(data: FeeDTO) {
    try {
      const fee = await this.prismaService.fee.create({
        data: {
          name: data.name,
          schoolYearId: data.schoolYearId,
          value: data.value,
          createdAt: data.createdAt,
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

  /////////////////////////////////////////////////
  // PAYMENTS
  /////////////////////////////////////////////////

  async updatePayment(id: number, data: PaymentDTO) {
    try {
      const payment = await this.prismaService.payment.update({
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
        include: {
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
        },
      });
      return { success: true, message: 'Pago actualizado exitosamente', data: payment };
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
