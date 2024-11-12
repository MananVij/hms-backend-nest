import { IsOptional, IsString, IsNumber, IsBoolean, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class PhoneNumberDto {
  @IsOptional()
  @IsString()
  phone_no?: string;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean = false;  // Default value set to false
}

export class UpdateClinicDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  timings?: string;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsOptional()
  @IsBoolean()
  is_online?: boolean;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean = false;  // Default value set to false

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhoneNumberDto)
  @ArrayMinSize(1)
  contact_number?: PhoneNumberDto[];

  @IsOptional()
  @IsNumber()
  doctor_id?: number;
}