import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { RecordTypeEnum } from '../entity/medical-reports.entity';

export class CreateMedicalReportDto {
  @IsUUID()
  @IsNotEmpty()
  uploadedBy: string;

  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @IsArray()
  @IsOptional()
  canBeAccessedBy?: string[];

  @IsEnum(RecordTypeEnum)
  @IsNotEmpty()
  recordType: RecordTypeEnum;
}
