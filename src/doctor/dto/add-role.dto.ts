import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';
import { AddressDto, CreateUserDto } from 'src/user/dto/create-user.dto';
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
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  specialization: string;

  @IsDateString()
  @IsNotEmpty()
  startYearOfPractice: string;

  @IsArray()
  @IsNotEmpty()
  timings: {
    day: string;
    startTime: Date;
    endTime: Date;
  }[];
}

export class AddRoleToAdminDto {
  @IsNotEmpty()
  staffData: CreateStaffDto;

  @IsNotEmpty()
  address: AddressDto;

  @IsNotEmpty()
  metaData: CreateMetaDataDto;

  @IsNotEmpty()
  clinicId: number;

  @IsNotEmpty()
  @IsEnum(UserRole, { each: true })
  role: UserRole;
}
