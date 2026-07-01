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
import { PaymentDTO, PaymentTypeDTO, PaymentMethodDTO, ExchangeDTO, FeeDTO, UpdateFeeDTO } from './payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  /////////////////////////////////////////////////
  // PAYMENT TYPES
  /////////////////////////////////////////////////

  @Get('/payment-types')
  getPaymentTypes() {
    return this.service.getPaymentTypes();
  }

  @Post('/payment-types')
  createPaymentType(@Body() dto: PaymentTypeDTO) {
    return this.service.createPaymentType(dto);
  }

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
  createMethod(@Body() dto: PaymentMethodDTO) {
    return this.service.createPaymentMethod(dto);
  }

  @Put('/payment-methods/:id')
  updateMethod(@Param('id') id: string, @Body() dto: PaymentMethodDTO) {
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
  createExchange(@Body() dto: ExchangeDTO) {
    return this.service.createExchange(dto);
  }

  /////////////////////////////////////////////////
  // FEES
  /////////////////////////////////////////////////

  @Get('/fees')
  getFees(@Query('schoolYearId') schoolYearId?: string) {
    return this.service.getFees(schoolYearId ? +schoolYearId : undefined);
  }

  @Get('/fees/:id')
  getFee(@Param('id') id: string) {
    return this.service.getFeeById(+id);
  }

  @Post('/fees')
  createFee(@Body() dto: FeeDTO) {
    return this.service.createFee(dto);
  }

  @Put('/fees/:id')
  updateFee(@Param('id') id: string, @Body() dto: UpdateFeeDTO) {
    return this.service.updateFee(+id, dto);
  }

  @Delete('/fees/:id')
  deleteFee(@Param('id') id: string) {
    return this.service.deleteFee(+id);
  }

  /////////////////////////////////////////////////
  // STUDENTS WITH DEBTS
  /////////////////////////////////////////////////

  @Get('/students-with-debts')
  getStudentsWithDebts() {
    return this.service.getStudentsWithDebts();
  }

  /////////////////////////////////////////////////
  // PAYMENTS
  /////////////////////////////////////////////////

  @Get()
  getPayments(
    @Query('page') page?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('exactDate') exactDate?: string,
    @Query('feeId') feeId?: string,
    @Query('paymentMethodId') paymentMethodId?: string,
    @Query('studentSearch') studentSearch?: string,
    @Query('representativeSearch') representativeSearch?: string,
    @Query('morosos') morosos?: string,
    @Query('studentId') studentId?: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.service.getPayments({
      ...(page && { page: Number(page) }),
      ...(take && { take: Number(take) }),
      ...(search && { search }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(exactDate && { exactDate }),
      ...(feeId && { feeId: Number(feeId) }),
      ...(paymentMethodId && { paymentMethodId: Number(paymentMethodId) }),
      ...(studentSearch && { studentSearch }),
      ...(representativeSearch && { representativeSearch }),
      ...(morosos === 'true' && { morosos: true }),
      ...(studentId && { studentId: Number(studentId) }),
      ...(schoolYearId && { schoolYearId: Number(schoolYearId) }),
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
  updatePayment(@Param('id') id: string, @Body() dto: PaymentDTO) {
    return this.service.updatePayment(+id, dto);
  }

  @Delete(':id')
  deletePayment(@Param('id') id: string) {
    return this.service.deletePayment(+id);
  }

}
