import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateDoctorClinicDto {
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsInt()
  @IsNotEmpty()
  clinicId: number;
}
