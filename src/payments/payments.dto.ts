import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Currency } from '../../generated/prisma/client';

// PAYMENT METHOD
export class PaymentMethodDTO {
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  identification?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// EXCHANGE
export class ExchangeDTO {
  @IsNumber()
  rate!: number;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  date!: Date;
}

// CHARGE TYPE
export class ChargeTypeDTO {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// STUDENT CHARGE
export class StudentChargeDTO {
  @IsNumber()
  studentId!: number;

  @IsNumber()
  chargeTypeId!: number;

  @IsOptional()
  @IsNumber()
  schoolYearId?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// PAYMENT
export class PaymentDTO {
  @IsNumber()
  paymentMethodId!: number;

  @IsOptional()
  @IsNumber()
  exchangeId?: number;

  @IsNumber()
  totalAmount!: number;

  @IsEnum(Currency)
  currency!: Currency;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  payerName?: string;

  @IsOptional()
  @IsString()
  payerIdentification?: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;

  @IsBoolean()
  status!: boolean;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  paymentDate!: Date;

}
