import { Roles, RolesEnum } from '@decorators/roles.decorator';
import { LocalAuthGuard } from '@guards/localAuth.guard';
import RolesGuard from '@guards/roles.guard';
import { SuccessResponseInterface } from '@interfaces/successResponse.interface';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authConstants } from '@routes/auth/auth.constants';
import { AuthService } from '@routes/auth/auth.service';
import RefreshTokenDto from '@routes/auth/dtos/refreshToken.dto';
import { SignUpDto } from '@routes/auth/dtos/signUp.dto';
import { DecodedUser } from '@routes/auth/interfaces/decodedUser.interface';
import { UserEntity } from '@routes/users/schemas/user.entity';
import { UsersService } from '@routes/users/users.service';
import ResponseUtils from '@utils/response.utils';
import { Request as ExpressRequest } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<SuccessResponseInterface | never> {
    await this.usersService.createUser(signUpDto);

    return ResponseUtils.success('auth', {
      message: 'Success! please verify your email',
    });
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  async signIn(
    @Request() req: ExpressRequest,
  ): Promise<SuccessResponseInterface | never> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = req.user as UserEntity;

    return ResponseUtils.success('tokens', await this.authService.login(user));
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<any> {
    const decodedUser = this.jwtService.decode(
      refreshTokenDto.refreshToken,
    ) as DecodedUser;

    if (!decodedUser) {
      throw new ForbiddenException('Incorrect token');
    }

    const oldRefreshToken: string | null =
      await this.authService.getRefreshTokenByEmail(decodedUser.email);

    if (!oldRefreshToken || oldRefreshToken !== refreshTokenDto.refreshToken) {
      throw new UnauthorizedException(
        'Authentication credentials were missing or incorrect',
      );
    }

    const payload = {
      id: decodedUser.id,
      email: decodedUser.email,
    };

    return ResponseUtils.success(
      'tokens',
      await this.authService.login(payload),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Get('verify/:token')
  async verifyUser(
    @Param('token') token: string,
  ): Promise<SuccessResponseInterface | never> {
    const { id } = await this.authService.verifyTokenWithSecret(
      token,
      authConstants.jwt.secrets.accessToken,
    );

    const user = await this.usersService.getUnverifiedUserById(id);

    if (!user) {
      throw new NotFoundException('User does not exists');
    }
    return ResponseUtils.success(
      'users',
      await this.usersService.update(user.id, { verified: true }),
    );
  }

  @Delete()
  async deleteAccount() {
    return 'Delete Account';
  }

  @Delete('logout-all')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(): Promise<string> {
    return this.authService.deleteAllTokens();
  }
}
