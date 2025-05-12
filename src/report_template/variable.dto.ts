import {
  IsEnum,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { VariableType } from './report-template.enum';
import { Type } from 'class-transformer';

export class VariableDto {
  @IsString()
  key: string;

  @IsString()
  displayName: string;

  @IsEnum(VariableType)
  type: VariableType;

  @IsOptional()
  @IsBoolean()
  isArray?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariableDto)
  fields?: VariableDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsOptional()
  @IsBoolean()
  ignore?: boolean;
}
