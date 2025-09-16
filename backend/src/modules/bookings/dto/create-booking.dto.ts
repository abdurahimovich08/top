import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsString()
  @IsNotEmpty()
  packageId!: string;

  @IsOptional()
  @IsString()
  slotId?: string;

  @IsISO8601()
  scheduledAt!: string;

  @IsString()
  @IsNotEmpty()
  addressId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
