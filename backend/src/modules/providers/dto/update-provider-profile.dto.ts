import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;
}
