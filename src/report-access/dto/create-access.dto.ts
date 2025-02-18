import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { RecordTypeEnum } from 'src/medical-reports/entity/medical-reports.entity';

export class CreateMedicalReportDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsEnum(RecordTypeEnum)
  @IsNotEmpty()
  recordType: RecordTypeEnum;
}
