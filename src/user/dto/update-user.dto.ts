import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entity/user.enitiy';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole, {each: true})
  role: UserRole[];

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @MinLength(6)
  password: string;

  @IsBoolean()
  is_verified: boolean;
}
