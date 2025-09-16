import { IsBoolean } from 'class-validator';

export class ConfirmPaymentDto {
  @IsBoolean()
  success!: boolean;
}
