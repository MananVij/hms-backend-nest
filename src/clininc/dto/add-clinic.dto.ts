import { IsNotEmpty, IsString, IsNumber, IsBoolean, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class PhoneNumberDto {
  @IsNotEmpty()
  @IsString()
  phone_no: string;

  @IsNotEmpty()
  @IsBoolean()
  is_verified: boolean = false;
}

export class CreateClinicDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  timings: string;

  @IsNotEmpty()
  @IsNumber()
  fee: number;

  @IsNotEmpty()
  @IsBoolean()
  is_online: boolean;

  @IsNotEmpty()
  @IsBoolean()
  is_verified: boolean = false; // Main clinic verification field

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PhoneNumberDto)
  @ArrayMinSize(1) // Ensures at least one phone number
  contact_number: PhoneNumberDto[];

  @IsNotEmpty()
  @IsString()
  admin_id: string;

  @IsNotEmpty()
  @IsNumber()
  doctor_id: number; // This is the ID of the Doctor
}
