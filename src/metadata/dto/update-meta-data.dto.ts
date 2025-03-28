import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMetaDataDto {
  @IsOptional()
  @IsString()
  name?: string;

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
