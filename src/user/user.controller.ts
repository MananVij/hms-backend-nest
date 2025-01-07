import {
  Body,
  ConflictException,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entity/user.enitiy';
import { QueryRunner } from 'typeorm';
import { UseInterceptors } from '@nestjs/common';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async create(
    @Body() createUserDto: CreateUserDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
    try {
      const user = await this.userService.createUser(
        createUserDto,
        queryRunner,
      );
      return user;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  @Get('')
  async findPatientByPhoneNo(
    @Query('phoneNo') phoneNo: string,
    @Query('role') role: string,
  ): Promise<User> {
    if (role === UserRole.PATIENT) {
      return this.userService.findPatientByPhoneNumber(phoneNo);
    } else {
      return this.userService.findStaffByPhoneNumber(phoneNo);
    }
  }
}
