import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { authConstants } from '@routes/auth/auth.constants';
import { JwtStrategyValidate } from '@routes/auth/interfaces/jwtStrategyValidate.interface';
import { UserEntity } from '@routes/users/schemas/user.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export default class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'refreshToken',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConstants.jwt.secrets.refreshToken,
    });
  }

  async validate(payload: UserEntity): Promise<JwtStrategyValidate> {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }
}
