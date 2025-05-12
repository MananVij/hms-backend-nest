import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { ReportSubType, ReportType } from './report-template.enum';

export class CreateReportTemplateDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ReportSubType)
  subtype: ReportSubType;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  variableNames: string[];
}
