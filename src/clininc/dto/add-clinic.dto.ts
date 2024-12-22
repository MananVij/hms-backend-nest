import {
  IsNotEmpty,
  IsString,
  IsBoolean,
} from 'class-validator';

export class CreateClinicDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  line1: string;

  @IsString()
  line2?: string;

  @IsNotEmpty()
  @IsString()
  pincode: string;

  @IsNotEmpty()
  @IsBoolean()
  is_verified: boolean = false;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsString()
  admin_id: string;
}
