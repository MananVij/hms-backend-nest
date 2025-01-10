import { IsOptional, IsNumber, IsUUID, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BloodPressureDto {
  @IsNumber()
  @Min(0)
  @Max(300)
  systolic: number;

  @IsNumber()
  @Min(0)
  @Max(300)
  diastolic: number;
}

export class CreateVitalsDto {
  // The ID of the user to whom these vitals belong
  @IsUUID()
  patientId: string;

  @IsUUID()
  appointmentId: number;

  // Optional blood pressure object containing systolic and diastolic values
  @IsOptional()
  @ValidateNested()
  @Type(() => BloodPressureDto)
  bp?: BloodPressureDto;

  // Weight in kilograms
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  // Pulse in beats per minute (BPM)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  pulse?: number;

  // Body temperature in Fahrenheit
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  temp?: number;

  // Oxygen saturation percentage
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  oxy?: number;
}
