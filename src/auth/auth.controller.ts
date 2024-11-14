import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from 'src/user/entity/user.enitiy';

@Controller('') // Auth-specific route
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Post('login')
  async validateUserCredentials(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return await this.authService.login({ email, password });
  }
}
