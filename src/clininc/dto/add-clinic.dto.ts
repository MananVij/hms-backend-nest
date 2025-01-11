import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  Matches,
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
  @Matches(/^\d{6}$/, {
    message: 'Pincode must be exactly 6 digits and only contain numbers',
  })
  pincode: string;

  @IsNotEmpty()
  @IsBoolean()
  is_verified: boolean = false;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits and only contain numbers',
  })
  contactNumber: string;
}
