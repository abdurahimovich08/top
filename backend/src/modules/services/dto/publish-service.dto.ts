import { IsBoolean } from 'class-validator';

export class PublishServiceDto {
  @IsBoolean()
  isPublished!: boolean;
}
