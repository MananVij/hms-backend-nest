import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';

class CreateStaffDto {
  @IsString()
  qualification?: string;

  @IsNotEmpty()
  @IsNumber()
  fee: number;

  @IsBoolean()
  isOnline: boolean;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsString()
  @IsNotEmpty()
  specialization: string;

  @IsDateString()
  @IsOptional()
  startYearOfPractice?: string;

  @IsArray()
  @IsNotEmpty()
  timings: {
    day: string;
    startTime: Date;
    endTime: Date;
  }[];

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

  @IsBoolean()
  usesOwnLetterPad: boolean;
}
export class CreateDoctorDto {
  @IsNotEmpty()
  staffData: CreateStaffDto;

  @IsNotEmpty()
  userData: CreateUserDto;

  @IsNotEmpty()
  metaData: CreateMetaDataDto;

  @IsNotEmpty()
  clinicId: number;

  @IsNotEmpty()
  @IsEnum(UserRole, { each: true })
  role: UserRole;
}
