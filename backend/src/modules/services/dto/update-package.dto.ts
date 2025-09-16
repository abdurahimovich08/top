import { PartialType } from '@nestjs/swagger';
import { CreatePackageDto } from './create-package.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
