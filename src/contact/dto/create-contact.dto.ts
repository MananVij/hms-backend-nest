import { IsNotEmpty, IsString, IsNumber, Length, IsOptional } from 'class-validator';
import { OneToOne } from 'typeorm';
import { User } from '../../user/entity/user.enitiy';

export class CreateContactDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 10)
  phone_number: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 6)
  pincode: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  line1: string;

  @IsOptional() // line2 is optional
  @IsString()
  @Length(0, 255)
  line2?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 5)
  country_code: string;

  @OneToOne(() => User, {nullable: false})
  user: User;

  @IsNotEmpty()
  @IsString()
  uid: string; // Refers to the user ID
}
