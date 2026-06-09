import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentDTO, FeeDTO } from './payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  /////////////////////////////////////////////////
  // PAYMENT METHODS
  /////////////////////////////////////////////////

  @Get('/payment-methods')
  getMethods() {
    return this.service.getPaymentMethods();
  }

  @Get('/payment-methods/:id')
  getMethod(@Param('id') id: string) {
    return this.service.getPaymentMethod(+id);
  }

  @Post('/payment-methods')
  createMethod(@Body() dto: any) {
    return this.service.createPaymentMethod(dto);
  }

  @Put('/payment-methods/:id')
  updateMethod(@Param('id') id: string, @Body() dto: any) {
    return this.service.updatePaymentMethod(+id, dto);
  }

  /////////////////////////////////////////////////
  // EXCHANGE
  /////////////////////////////////////////////////

  @Get('/exchange')
  getExchange() {
    return this.service.getExchangeRates();
  }

  @Post('/exchange')
  createExchange(@Body() dto: any) {
    return this.service.createExchange(dto);
  }

  /////////////////////////////////////////////////
  // FEES
  /////////////////////////////////////////////////

  @Get('/fees')
  getFees() {
    return this.service.getFees();
  }

  @Post('/fees')
  createFee(@Body() dto: FeeDTO) {
    return this.service.createFee(dto);
  }

  /////////////////////////////////////////////////
  // PAYMENTS
  /////////////////////////////////////////////////

  @Get()
  getPayments(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('exactDate') exactDate?: string,
    @Query('feeId') feeId?: string,
    @Query('paymentMethodId') paymentMethodId?: string,
    @Query('studentSearch') studentSearch?: string,
    @Query('representativeSearch') representativeSearch?: string,
    @Query('morosos') morosos?: string,
  ) {
    return this.service.getPayments({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(exactDate && { exactDate }),
      ...(feeId && { feeId: Number(feeId) }),
      ...(paymentMethodId && { paymentMethodId: Number(paymentMethodId) }),
      ...(studentSearch && { studentSearch }),
      ...(representativeSearch && { representativeSearch }),
      ...(morosos === 'true' && { morosos: true }),
    });
  }

  @Get(':id')
  getPayment(@Param('id') id: string) {
    return this.service.getPaymentById(+id);
  }

  @Post()
  createPayment(@Body() data: PaymentDTO) {
    return this.service.createPayment(data);
  }

  @Put(':id')
  updatePayment(@Param('id') id: string, @Body() dto: any) {
    return this.service.updatePayment(+id, dto);
  }

}
