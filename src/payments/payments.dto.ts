import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Currency } from '../../generated/prisma/client';

// PAYMENT TYPE
export class PaymentTypeDTO {
  @IsString()
  type!: string;

  @IsEnum(Currency)
  currency!: Currency;
}

// PAYMENT METHOD
export class PaymentMethodDTO {
  @IsNumber()
  paymentTypeId!: number;

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

  @IsOptional()
  @IsBoolean()
  setByUser?: boolean;
}

// FEE
export class FeeDTO {
  @IsString()
  name!: string;

  @IsNumber()
  schoolYearId!: number;

  @IsNumber()
  value!: number;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  createdAt?: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  startAt!: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  endAt!: Date;
}

export class UpdateFeeDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startAt?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endAt?: Date;
}

// STUDENT FEE ITEM (for multi-student multi-fee payments)
export class StudentFeeItemDTO {
  @IsNumber()
  studentId!: number;

  @IsNumber()
  feeId!: number;

  @IsNumber()
  amount!: number;
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
  zellePayer?: string;

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

  @IsOptional()
  @IsString()
  description?: string;

  // Array of student-fee pairs with amounts for multi payments
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentFeeItemDTO)
  studentFees?: StudentFeeItemDTO[];
}
