import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../entity/user_clinic.entity';

export class CreateUserClinicDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @IsNotEmpty()
  clinicId: number;

  @IsNotEmpty()
  @IsEnum(UserRole, { each: true })
  role: UserRole[];
}
