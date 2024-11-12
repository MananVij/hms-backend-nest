import {
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsNumber,
  IsString,
} from 'class-validator';
import { PaymnetMode } from '../entity/appointment.entity';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  doctor: string; // Doctor's User ID (UUID)

  @IsNotEmpty()
  @IsString()
  patient: string; // Patient's User ID (UUID)

  @IsNotEmpty()
  @IsDateString()
  startTime: Date; // Appointment date and time

  @IsNotEmpty()
  @IsDateString()
  endTime: Date; // Appointment date and time

  @IsString()
  visitType: string; // Patient's User ID (UUID)

  @IsNotEmpty()
  @IsNumber()
  clinic_id: number; // Clinic identifier

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean; // Indicates if the appointment has been paid for

  @IsNotEmpty()
  @IsEnum(PaymnetMode)
  paymentMode: PaymnetMode; // Payment mode (online or offline)

  @IsBoolean()
  @IsOptional()
  hasVisited?: boolean; // Indicates if the patient has visited the clinic

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  prescriptionId?: string; // Reference to associated prescription (optional)
}
