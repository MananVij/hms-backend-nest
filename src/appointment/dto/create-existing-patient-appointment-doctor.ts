import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateExistingPatientAppointmentByDoctorDto {
  @IsNotEmpty()
  @IsString()
  patient: string; // Patient's User ID (UUID)

  @IsString()
  visitType: string; // Patient's User ID (UUID)

  @IsNotEmpty()
  @IsNumber()
  clinic_id: number; // Clinic identifier

  @IsNotEmpty()
  @IsDateString()
  time: Date; // Appointment date and time
}
