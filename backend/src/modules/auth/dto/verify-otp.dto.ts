import { IsEnum, IsOptional, IsPhoneNumber, Length } from 'class-validator';
import { UserRole } from '@prisma/client';

export class VerifyOtpDto {
  @IsPhoneNumber('UZ')
  phone!: string;

  @Length(6, 6)
  code!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
