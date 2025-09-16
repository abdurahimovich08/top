import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsPhoneNumber('UZ')
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.CUSTOMER;
}
