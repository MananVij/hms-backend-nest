import { IsNotEmpty, IsUUID } from 'class-validator';

export class RevokeAccessDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;
}