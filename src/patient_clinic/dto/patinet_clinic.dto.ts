import { IsUUID, IsInt, IsNotEmpty } from 'class-validator';

export class CreatePatientClinicDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsInt()
  clinicId: number;
}
