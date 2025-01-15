import { Controller, Get, Query, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entity/user.enitiy';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { Request } from 'src/interfaces/request.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  async findPatientByPhoneNo(
    @Req() req: Request,
    @Query('phoneNo') phoneNo: string,
    @Query('role') role: string,
  ): Promise<User> {
    try {
      const userId = req?.user?.uid;
      if (role === UserRole.PATIENT) {
        return this.userService.findUserByPhoneNumber(userId, phoneNo, {
          isPatient: true,
        });
      } else {
        return this.userService.findUserByPhoneNumber(userId, phoneNo, {
          isPatient: false,
        });
      }
    } catch (error) {
      throw error;
    }
  }
}
