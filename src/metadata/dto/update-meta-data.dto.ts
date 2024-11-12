import { Type } from 'class-transformer';
import { IsOptional, IsDate, IsString } from 'class-validator';

export class UpdateMetaDataDto {
  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @Type(() => Date)
  dob?: Date;
}
