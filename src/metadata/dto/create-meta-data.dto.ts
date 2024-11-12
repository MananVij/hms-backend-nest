import { IsDate, IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
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

  @IsNotEmpty()
  @IsString()
  height: string;


  @IsNotEmpty()
  @IsString()
  weight: string;

  @IsNotEmpty()
  @IsString()
  uid: string; // Maps to user id
}
