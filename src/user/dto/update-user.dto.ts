import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @MinLength(6)
  password: string;

  @IsBoolean()
  is_verified: boolean;
}
