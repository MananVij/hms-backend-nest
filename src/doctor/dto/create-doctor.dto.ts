import { IsString, IsNotEmpty, IsDateString, IsArray, IsUUID } from 'class-validator';
import { User } from 'src/user/entity/user.enitiy';
import { OneToOne } from 'typeorm';

export class CreateDoctorDto {
  @IsArray()
  @IsNotEmpty()
  qualification: {
    qualification: string;
    college: string;
    notes?: string;
  }[];

  @IsString()
  @IsNotEmpty()
  license_number: string;

  @IsString()
  @IsNotEmpty()
  specialization: string;

  @IsDateString()
  @IsNotEmpty()
  start_date_of_practice: string;

  @IsArray()
  @IsNotEmpty()
  languages_spoken: string[];

  @IsArray()
  @IsNotEmpty()
  timings: {
    day: string;
    start_time: string;
    end_time: string;
  }[];

  @IsString()
  @IsNotEmpty()
  user: string;  // Maps to the user's UID (UUID) in the User entity
}
