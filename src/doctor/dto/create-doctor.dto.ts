import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { CreateMetaDataDto } from 'src/metadata/dto/create-meta-data.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

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
export class CreateDoctorDto {
  @IsNotEmpty()
  staffData: CreateStaffDto;

  @IsNotEmpty()
  userData: CreateUserDto;

  @IsNotEmpty()
  metaData: CreateMetaDataDto;

  @IsNotEmpty()
  clinicId: number;
}
