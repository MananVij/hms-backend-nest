import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateDoctorClinicDto {
  @IsInt()
  @IsNotEmpty()
  doctor_id: number;

  @IsInt()
  @IsNotEmpty()
  clinic_id: number;
}
