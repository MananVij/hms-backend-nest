import { IsString, IsEmail, IsEnum, IsNotEmpty, IsBoolean, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../entity/user.enitiy'

export class CreateUserDto {
  @IsNotEmpty()
  @IsEnum(UserRole, {each: true})
  role: UserRole[];

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @MinLength(6)
  password: string;

  @IsBoolean()
  is_verified: boolean;
}
