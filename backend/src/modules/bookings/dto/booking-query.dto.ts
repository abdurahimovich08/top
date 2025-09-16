import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

export class BookingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
