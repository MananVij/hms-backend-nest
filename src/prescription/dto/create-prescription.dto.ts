import {
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FrequencyEnum {
  OD = 'Once Daily',
  BID = 'Twice Daily',
  TID = 'Three Times Daily',
  QID = 'Four Times Daily',
  HS = 'At Bedtime',
  AC = 'Before Meals',
  PC = 'After Meals',
}

export class FoodDto {
  @IsBoolean()
  before_breakfast: boolean;

  @IsBoolean()
  after_breakfast: boolean;

  @IsBoolean()
  after_lunch: boolean;

  @IsBoolean()
  after_dinner: boolean;
}

export class FrequencyDto {
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
}

export class CreatePrescriptionDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  appointmentId: number;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  audio_url?: string;

  @IsOptional()
  @IsString()
  pres_url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  test_suggested?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  test_results?: string[];

  @IsOptional()
  @IsString()
  medical_notes?: string;

  @IsOptional()
  @IsString()
  history?: string;

  @IsOptional()
  // @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medication?: MedicationDto[];

  @IsOptional()
  @IsUUID()
  vitalsId?: number;

  @IsBoolean()
  is_gemini_data: boolean;

  @IsBoolean()
  is_edited: boolean;

  @IsBoolean()
  is_final_prescription: boolean;

  @IsDateString()
  @IsOptional()
  followUp?: Date;
}

class TaperingDto {
  @IsEnum(FrequencyEnum)
  frequency: FrequencyEnum;

  @IsNumber()
  days: number;

  @IsString()
  comments: string;
}

export class MedicationDto {
  @IsString()
  medicine_name: string;

  @IsOptional()
  @IsString()
  original_name?: string;

  @IsOptional()
  @IsArray()
  rejected_matches?: string[];

  @IsOptional()
  @IsBoolean()
  no_match_found?: boolean;

  @IsNumber()
  days: number;

  @IsBoolean()
  is_sos: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => FrequencyDto)
  frequency?: FrequencyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FoodDto)
  food?: FoodDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TaperingDto)
  tapering?: TaperingDto[] | null;
}
