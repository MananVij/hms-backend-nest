import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsDate,
  IsEnum,
} from 'class-validator';
import { PaymnetMode } from '../entity/appointment.entity';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDate()
  timing?: Date; // Optional, can be updated

  @IsOptional()
  @IsNumber()
  clinic_id?: number; // Optional, can be updated

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean; // Optional, can be updated

  @IsOptional()
  @IsEnum(PaymnetMode)
  role: PaymnetMode; // Optional, can be updated, add enum if needed

  @IsOptional()
  @IsBoolean()
  hasVisited?: boolean; // Optional, can be updated

  @IsOptional()
  prescriptionId?: string; // Reference to the associated prescription (optional)
}
