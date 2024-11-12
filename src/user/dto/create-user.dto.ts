import { IsString, IsEmail, IsEnum, IsNotEmpty, IsBoolean, MinLength } from 'class-validator';
import { UserRole } from '../entity/user.enitiy'

export class CreateUserDto {
  @IsNotEmpty()
  @IsEnum(UserRole, {each: true})
  role: UserRole[];

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsBoolean()
  is_verified: boolean;
}
