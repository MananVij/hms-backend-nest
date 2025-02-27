import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../entity/user_clinic.entity';

export class CreateUserClinicDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @IsNotEmpty()
  clinicId: number;

  @IsNotEmpty()
  @IsEnum(UserRole, { each: true })
  role: UserRole[];

  @IsOptional()
  headerImage?: Buffer;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  footerText?: string;

  @IsOptional()
  padding?: {
    paddingTop?: number | null;
    paddingLeft?: number | null;
    paddingBottom?: number | null;
    paddingRight?: number | null;
  };

  @IsOptional()
  @IsBoolean()
  usesOwnLetterPad?: boolean;
}
