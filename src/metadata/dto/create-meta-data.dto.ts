import { IsDate, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { UserSex } from '../entity/metadata.entity';
import { Type } from 'class-transformer';

export class CreateMetaDataDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dob: Date;

  @IsNotEmpty()
  @IsEnum(UserSex)
  sex: UserSex;

  @IsOptional()
  @IsString()
  height?: string;

  @IsNotEmpty()
  @IsString()
  uid: string; // Maps to user id
}
