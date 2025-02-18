import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsBoolean,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
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
}

export class CreateUserDto {

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits and only contain numbers',
  })
  phoneNumber?: string;

  @IsOptional()
  isPatient?: boolean;

  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}
