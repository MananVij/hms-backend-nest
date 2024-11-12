import { IsString, Length, IsOptional, IsNumber } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @Length(1, 10)
  phone_number?: string;

  @IsOptional()
  @IsString()
  @Length(1, 6)
  pincode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  line1?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  line2?: string;

  @IsOptional()
  @IsString()
  @Length(1, 5)
  country_code?: string;

  // uid should not be updated, hence it's omitted here
}
