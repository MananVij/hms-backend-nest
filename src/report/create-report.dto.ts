import { IsNumber, IsObject, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  patientId: string;

  @IsString()
  doctorId: string;

  @IsNumber()
  clinicId: number;

  @IsObject()
  values: Record<string, string | null>;
}
