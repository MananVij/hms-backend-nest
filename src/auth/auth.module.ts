import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ErrorLogModule } from 'src/errorlog/error-log.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY, // Secret used to sign the JWT
      signOptions: { expiresIn: '24h' }, // Expiration time of the JWT
    }),
    ErrorLogModule,
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard], // The services and guards used by the module
  controllers: [AuthController], // Controllers exposed by the module
})
export class AuthModule {}
