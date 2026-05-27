import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentDTO } from './payments.dto';

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
  // CHARGE TYPES
  /////////////////////////////////////////////////

  @Get('/charge-types')
  getChargeTypes() {
    return this.service.getChargeTypes();
  }

  @Post('/charge-types')
  createChargeType(@Body() dto: any) {
    return this.service.createChargeType(dto);
  }

  /////////////////////////////////////////////////
  // STUDENT CHARGES
  /////////////////////////////////////////////////

  @Get('/student-charges')
  getCharges() {
    return this.service.getStudentCharges();
  }

  @Post('/student-charges')
  createCharge(@Body() dto: any) {
    return this.service.createStudentCharge(dto);
  }

  /////////////////////////////////////////////////
  // PAYMENTS
  /////////////////////////////////////////////////

  @Get()
  getPayments() {
    return this.service.getPayments();
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
