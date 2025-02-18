import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ShareReportDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @IsBoolean()
  indefinite?: boolean;
}
