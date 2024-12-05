import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entity/user.enitiy';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService, // Use UserService for user-related operations
    private readonly jwtService: JwtService, // If using JWT
  ) {}

  async signup(createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    const payload = { email: user.email, role: user.role, id: user.uid };

    return { access_token: this.jwtService.sign(payload), user }; // Or generate a JWT and return it
  }

  async login(loginDto: { email: string; password: string }): Promise<any> {
    const user = await this.userService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, role: user.role, id: user.uid, phone_number: user?.phone_number, qualification: user?.qualification, name: user?.name  };
    return {
      access_token: this.jwtService.sign(payload), // Return JWT if using
    };
  }
}
