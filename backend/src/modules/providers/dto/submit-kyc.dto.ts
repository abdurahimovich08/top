import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  documentNumber!: string;

  @IsOptional()
  @IsUrl()
  documentUrl?: string;
}
