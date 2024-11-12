import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from Authorization header
      ignoreExpiration: false, // Token expiration validation
      secretOrKey: 'your-secret-key', // Replace with your actual secret key
    });
  }

  async validate(payload: any) {
    // Return user object based on payload
    return { uid: payload.id, email: payload.email, role: payload.role };
  }
}
