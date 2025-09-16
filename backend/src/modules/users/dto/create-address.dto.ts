import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  line2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  country!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
