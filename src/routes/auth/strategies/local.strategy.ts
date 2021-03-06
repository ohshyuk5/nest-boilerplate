import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '@routes/auth/auth.service';
import SignInDto from '@routes/auth/dtos/signIn.dto';
import { ValidateUserOutput } from '@routes/auth/interfaces/validateUserOutput.interface';
import { validate } from 'class-validator';
import { Request as ExpressRequest } from 'express';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(
    req: ExpressRequest,
    email: string,
    password: string,
  ): Promise<ValidateUserOutput> {
    const errors = await validate(new SignInDto(req.body));

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
