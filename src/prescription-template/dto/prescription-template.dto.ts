import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MedicationFoodDto {
  @IsBoolean()
  before_breakfast: boolean;

  @IsBoolean()
  after_breakfast: boolean;

  @IsBoolean()
  after_lunch: boolean;

  @IsBoolean()
  after_dinner: boolean;
}

class MedicationFrequencyDto {
  @IsBoolean()
  od: boolean;

  @IsBoolean()
  bid: boolean;

  @IsBoolean()
  tid: boolean;

  @IsBoolean()
  qid: boolean;

  @IsBoolean()
  hs: boolean;

  @IsBoolean()
  ac: boolean;

  @IsBoolean()
  pc: boolean;

  @IsBoolean()
  qam: boolean;

  @IsBoolean()
  qpm: boolean;

  @IsBoolean()
  bs: boolean;

  @IsBoolean()
  q6h: boolean;

  @IsBoolean()
  q8h: boolean;

  @IsBoolean()
  q12h: boolean;

  @IsBoolean()
  qod: boolean;

  @IsBoolean()
  q1w: boolean;

  @IsBoolean()
  q2w: boolean;

  @IsBoolean()
  q3w: boolean;

  @IsBoolean()
  q1m: boolean;
}

class MedicationDto {
  @IsString()
  medicine_name: string;

  @IsString()
  @IsOptional()
  dosage: string;

  @IsArray()
  @IsOptional()
  tapering: any[];

  @IsString()
  @IsOptional()
  days: string;

  @IsBoolean()
  @IsOptional()
  is_sos: boolean;

  @IsBoolean()
  @IsOptional()
  as_directed: boolean;

  @IsString()
  @IsOptional()
  directed_comments: string;

  @IsObject()
  @ValidateNested()
  @Type(() => MedicationFoodDto)
  @IsOptional()
  food?: MedicationFoodDto;

  @IsObject()
  @ValidateNested()
  @Type(() => MedicationFrequencyDto)
  @IsOptional()
  frequency?: MedicationFrequencyDto;
  
  @IsBoolean()
  @IsOptional()
  is_chip_selected?: boolean;
  
  @IsBoolean()
  @IsOptional()
  is_name_manually_edited?: boolean;
}

class TemplateDataDto {
  @IsString()
  @IsOptional()
  diagnosis: string;

  @IsString()
  @IsOptional()
  history: string;

  @IsOptional()
  @IsArray()
  test_suggested: string[];

  @IsOptional()
  @IsArray()
  test_results: string[];

  @IsString()
  @IsOptional()
  medical_notes: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medication: MedicationDto[];

  @IsBoolean()
  @IsOptional()
  is_gemini_data?: boolean;

  @IsBoolean()
  @IsOptional()
  is_handwritten_rx?: boolean;

  @IsBoolean()
  @IsOptional()
  is_voice_rx?: boolean;
}

export class CreatePrescriptionTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @ValidateNested()
  @Type(() => TemplateDataDto)
  data: TemplateDataDto;

  @IsBoolean()
  @IsOptional()
  isDefault: boolean;
}

export class UpdatePrescriptionTemplateDto extends CreatePrescriptionTemplateDto {}

export class FindTemplateDto {
  @IsUUID()
  @IsOptional()
  doctorId?: string;
}



