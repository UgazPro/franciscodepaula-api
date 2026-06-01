import { Transform } from 'class-transformer';
import {
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

// FEE
export class FeeDTO {
  @IsString()
  name!: string;

  @IsNumber()
  schoolYearId!: number;

  @IsNumber()
  value!: number;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  createdAt!: Date;
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

  @IsNumber()
  feeId!: number;
}
