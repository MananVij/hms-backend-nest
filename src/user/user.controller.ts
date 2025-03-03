import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from 'src/user_clinic/entity/user_clinic.entity';
import { Request } from 'src/interfaces/request.interface';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';
import { QueryRunner } from 'typeorm';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  async findPatientByPhoneNo(
    @Req() req: Request,
    @Query('phoneNo') phoneNo: string,
    @Query('role') role: string,
  ): Promise<any> {
    try {
      const userId = req?.user?.uid;
      if (role === UserRole.PATIENT) {
        return this.userService.findUsersByPhoneNumber(userId, phoneNo, {
          isPatient: true,
        });
      } else {
        return this.userService.findUsersByPhoneNumber(userId, phoneNo, {
          isPatient: false,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
    @Req() req: Request,
    @Body() body: { oldPassword: string; newPassword: string },
  ): Promise<any> {
    try {
      const userId = req?.user?.uid;
      await this.userService.updatePassword(
        queryRunner,
        userId,
        body.oldPassword,
        body.newPassword,
      );
    } catch (error) {
      throw error;
    }
  }
}
