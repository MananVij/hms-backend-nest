import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  uid: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Object)
  files: Express.Multer.File[];
}
