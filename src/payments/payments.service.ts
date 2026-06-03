import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { Injectable } from '@nestjs/common';
import { PaymentDTO, PaymentMethodDTO, ExchangeDTO, FeeDTO } from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private prismaService: PrismaService) {}

  async getPayments() {
    try {
      const payments = await this.prismaService.payment.findMany({
        include: {
          paymentMethod: true,
          exchange: true,
          paymentReferences: {
            include: {
              studentFee: {
                include: {
                  student: {
                    include: {
                      person: true,
                    },
                  },
                  fee: true,
                },
              },
              enrollments: true,
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
          paymentReferences: {
            include: {
              studentFee: {
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

        // Find or create StudentFee
        let studentFee;
        if (data.studentId && data.feeId) {
          studentFee = await tx.studentFee.findUnique({
            where: {
              studentId_feeId: { studentId: data.studentId, feeId: data.feeId },
            },
          });

          if (!studentFee) {
            studentFee = await tx.studentFee.create({
              data: {
                studentId: data.studentId,
                feeId: data.feeId,
                status: false,
              },
            });
          }
        }

        const paymentReference = await tx.paymentReference.create({
          data: {
            studentFeeId: studentFee.id,
            paymentId: payment.id,
          },
        });

        // Mark StudentFee as paid
        if (studentFee) {
          await tx.studentFee.update({
            where: { id: studentFee.id },
            data: { status: true },
          });
        }

        // Solo enlazar al enrollment si el fee es "Inscripción"
        if (data.studentId && studentFee) {
          const feeInfo = await tx.fee.findUnique({
            where: { id: studentFee.feeId },
          });

          if (feeInfo?.name === "Inscripción") {
            const enrollment = await tx.studentEnrollment.findFirst({
              where: {
                studentId: data.studentId,
                schoolYearId: feeInfo.schoolYearId,
              },
            });

            if (enrollment) {
              await tx.studentEnrollment.update({
                where: { id: enrollment.id },
                data: { referenceId: paymentReference.id, status: true },
              });
            }
          }
        }

        return payment;
      });

      return result;
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
      return method;
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
      return method;
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
      return exchange;
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
        },
      });
      return fee;
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
          paymentReferences: {
            include: {
              studentFee: {
                include: {
                  student: {
                    include: {
                      person: true,
                    },
                  },
                  fee: true,
                },
              },
              enrollments: true,
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
}
