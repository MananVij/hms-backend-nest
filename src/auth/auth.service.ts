import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { QueryRunner } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async login(loginDto: { email: string; password: string }): Promise<any> {
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
      user?.hasOnboardedClinic &&
      user?.defaultClinicId !== undefined &&
      user?.role !== undefined
    ) {
      return {
        access_token,
        defaultClinicId: user?.defaultClinicId,
        role: user?.role,
      };
    } else {
      return { access_token };
    }
  }
}
