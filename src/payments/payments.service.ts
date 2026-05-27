import { PrismaService } from '@/prisma/prisma.service';
import { badResponse } from '@/utilities/base.dto';
import { Injectable } from '@nestjs/common';
import { PaymentDTO, PaymentMethodDTO, ExchangeDTO, ChargeTypeDTO, StudentChargeDTO } from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private prismaService: PrismaService) {}

  async getPayments() {
    try {
      const payments = await this.prismaService.payment.findMany({
        include: {
          paymentMethod: true,
          exchange: true,
          charges: true,
        },
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
          charges: true,
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
      const payment = await this.prismaService.payment.create({
        data: {
          paymentMethodId: data.paymentMethodId,

          exchangeId: data.exchangeId,

          currency: data.currency,

          totalAmount: data.totalAmount,

          reference: data.reference,

          payerName: data.payerName,

          payerIdentification: data.payerIdentification,

          payerPhone: data.payerPhone,

          status: data.status,
        },
      });

      return payment;
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
  // CHARGE TYPES
  /////////////////////////////////////////////////

  async getChargeTypes() {
    try {
      const types = await this.prismaService.chargeType.findMany();
      return types;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createChargeType(data: ChargeTypeDTO) {
    try {
      const type = await this.prismaService.chargeType.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });
      return type;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  /////////////////////////////////////////////////
  // STUDENT CHARGES
  /////////////////////////////////////////////////

  async getStudentCharges() {
    try {
      const charges = await this.prismaService.studentCharge.findMany({
        include: {
          student: {
            include: {
              person: true,
            },
          },
          chargeType: true,
        },
      });
      return charges;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }

  async createStudentCharge(data: StudentChargeDTO) {
    try {
      const charge = await this.prismaService.studentCharge.create({
        data: {
          studentId: data.studentId,
          chargeTypeId: data.chargeTypeId,
          schoolYearId: data.schoolYearId,
          description: data.description,
        },
      });
      return charge;
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
          status: data.status,
        },
        include: {
          paymentMethod: true,
          exchange: true,
          charges: true,
        },
      });
      return payment;
    } catch (error) {
      badResponse.message = String(error);
      return badResponse;
    }
  }
}
