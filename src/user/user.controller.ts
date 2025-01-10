import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entity/user.enitiy';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  async findPatientByPhoneNo(
    @Query('phoneNo') phoneNo: string,
    @Query('role') role: string,
  ): Promise<User> {
    if (role === UserRole.PATIENT) {
      return this.userService.findUserByPhoneNumber(phoneNo, {
        isPatient: true,
      });
    } else {
      return this.userService.findUserByPhoneNumber(phoneNo, {
        isPatient: false,
      });
    }
  }
}
