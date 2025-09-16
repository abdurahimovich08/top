import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMediaDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  type?: 'IMAGE' | 'VIDEO';

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
