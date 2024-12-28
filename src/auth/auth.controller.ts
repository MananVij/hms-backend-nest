import {
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { TransactionInterceptor } from 'src/transactions/transaction.interceptor';
import { QueryRunner } from 'typeorm';
import { QueryRunnerParam } from 'src/transactions/query_runner_param';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseInterceptors(TransactionInterceptor)
  async signup(
    @Body() createUserDto: CreateUserDto,
    @QueryRunnerParam('queryRunner') queryRunner: QueryRunner,
  ) {
    try {
      return await this.authService.signup(createUserDto, queryRunner);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to signup user.Something Went Wrong.',
      );
    }
  }

  @Post('login')
  async validateUserCredentials(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return await this.authService.login({ email, password });
  }
}
