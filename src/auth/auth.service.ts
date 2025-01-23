import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { QueryRunner } from 'typeorm';
import { ErrorLogService } from 'src/errorlog/error-log.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async signup(createUserDto: CreateUserDto, queryRunner: QueryRunner) {
    try {
      const user = await this.userService.createUser(
        createUserDto,
        queryRunner,
      );
      const payload = {
        email: user.email,
        id: user.uid,
        name: user?.name,
      };
      return { access_token: this.jwtService.sign(payload) };
    } catch (error) {
      throw error;
    }
  }

  async login(loginDto: { email: string; password: string }): Promise<any> {
    try {
      const user = await this.userService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const payload = {
        email: user.email,
        id: user.uid,
        phoneNumber: user?.phoneNumber,
        qualification: user?.qualification,
        name: user?.name,
        hasOnboardedClinic: user?.hasOnboardedClinic,
      };
      const access_token = this.jwtService.sign(payload);
      if (
        user?.role === undefined &&
        user?.defaultClinicId === undefined &&
        user?.hasOnboardedClinic === false
      ) {
        return { access_token };
      }
      return {
        access_token,
        defaultClinicId: user?.defaultClinicId,
        role: user?.role,
        headerImage: user?.headerImage,
        footerText: user?.footerText,
        padding: user?.padding,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      await this.errorLogService.logError(
        `Unable to login user: ${error?.message}`,
        error?.stack,
        null,
        `Email: ${loginDto.email}`,
        null,
      );
      throw new InternalServerErrorException(
        'Unable to login at the moment. Something went wrong. Please try again later.',
      );
    }
  }
}
