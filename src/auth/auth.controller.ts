import {
  Body,
  Controller,
  ForbiddenException,
  Post,
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
      throw new ForbiddenException(
        'Only admins can sign up new users. Contact admin at hello@caresphere.in',
      );
      return await this.authService.signup(createUserDto, queryRunner);
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  async validateUserCredentials(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    try {
      return await this.authService.login({
        email: email.toLowerCase(),
        password,
      });
    } catch (error) {
      throw error;
    }
  }
}
