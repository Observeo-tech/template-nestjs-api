import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from '@/modules/users/application/use-cases/create-user.use-case';
import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { LoginWithGoogleUseCase } from '@/modules/auth/application/use-cases/login-with-google.use-case';
import { RequestPasswordResetUseCase } from '@/modules/auth/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '@/modules/auth/application/use-cases/reset-password.use-case';
import { ValidatePasswordResetTokenUseCase } from '@/modules/auth/application/use-cases/validate-password-reset-token.use-case';
import { toUserResponseDto, UserResponse } from '@/modules/users/presentation/http/dtos';
import { ApiDoc, Public } from '@/shared/http/decorators';
import { ResponseHelper } from '@/shared/http/helpers/response-helper';
import {
  AuthResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  ValidatePasswordResetTokenDto,
  ValidatePasswordResetTokenResponseDto,
} from '../dtos';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { envConfig } from '@/config/env.config';
import { SessionStorageService } from '@/shared/session-storage/session-storage.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly sessionStorageService: SessionStorageService,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly loginWithGoogleUseCase: LoginWithGoogleUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly validatePasswordResetTokenUseCase: ValidatePasswordResetTokenUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) { }

  @Public()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Check session',
    description: 'Check if this session is authenticated'
  })
  me(@Req() req: FastifyRequest) {
    const user = req.session.authenticated
      ? {
          id: req.session.userId,
          email: req.session.email,
          name: req.session.name,
        }
      : null;
    const currentOrganization = req.session.currentOrganizationId
      ? {
          id: req.session.currentOrganizationId,
          name: req.session.currentOrganizationName,
          role: req.session.currentOrganizationRole,
        }
      : null;

    return ResponseHelper.success({
      user,
      currentOrganization,
      authenticated: req.session.authenticated ?? false,
    });
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiDoc({
    summary: 'User register',
    description: 'Create a new user account and authenticate the session.',
    response: AuthResponseDto,
    commonResponses: [
      'badRequest',
      {
        type: 'conflict',
        description: 'User email already exists',
      },
    ],
  })
  async register(
    @Req() request: FastifyRequest,
    @Body() registerDto: RegisterDto,
  ): Promise<AuthResponseDto> {
    const result = await this.createUserUseCase.execute(registerDto);
    const user = toUserResponseDto(result.data);

    this.setAuthenticatedSession(request, user);
    await request.session.save();

    return {
      user,
      message: result.message,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'User login',
    description: 'Authenticate user with email and password. Returns user data without sensitive information.',
    response: AuthResponseDto,
    commonResponses: [
      'badRequest',
      {
        type: 'unauthorized',
        description: 'Invalid credentials',
      },
    ],
  })
  async login(
    @Req() request: FastifyRequest,
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    const result = await this.loginUseCase.execute({
      email: loginDto.email,
      password: loginDto.password,
    });

    const user = toUserResponseDto(result.user);
    this.setAuthenticatedSession(request, user);
    await request.session.save();

    return {
      user: toUserResponseDto(result.user),
      message: 'Login successful',
    };
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Google login',
    description: 'Authenticate or create a user with a Google ID token and persist the current session.',
    response: AuthResponseDto,
    commonResponses: [
      'badRequest',
      {
        type: 'unauthorized',
        description: 'Invalid Google token',
      },
      {
        type: 'conflict',
        description: 'Google account conflict',
      },
    ],
  })
  async loginWithGoogle(
    @Req() request: FastifyRequest,
    @Body() googleLoginDto: GoogleLoginDto,
  ): Promise<AuthResponseDto> {
    const result = await this.loginWithGoogleUseCase.execute({
      idToken: googleLoginDto.idToken,
    });

    const user = toUserResponseDto(result.user);
    this.setAuthenticatedSession(request, user);
    await request.session.save();

    return {
      user,
      message: result.message,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Logout',
    description: 'Destroys the current session and clears the session cookie.',
  })
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    this.clearAuthenticatedSessionContext();
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
    this.clearSessionCookie(reply);

    return ResponseHelper.success(null, 'Logout realizado com sucesso');
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Request password reset',
    description: 'Requests a password reset link and always returns a generic success response.',
    response: ForgotPasswordResponseDto,
    commonResponses: ['badRequest'],
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.requestPasswordResetUseCase.execute({
      email: dto.email,
    });

    return ResponseHelper.success({ submitted: true }, result.message);
  }

  @Public()
  @Get('reset-password/validate')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Validate password reset token',
    description: 'Validates whether the password reset token received by email is still valid.',
    response: ValidatePasswordResetTokenResponseDto,
    commonResponses: ['badRequest'],
    query: [
      {
        name: 'token',
        description: 'Password reset token',
      },
    ],
  })
  async validateResetPasswordToken(@Query() dto: ValidatePasswordResetTokenDto) {
    const result = await this.validatePasswordResetTokenUseCase.execute({
      token: dto.token,
    });

    return ResponseHelper.success(
      {
        valid: result.valid,
        expiresAt: result.expiresAt.toISOString(),
      },
      result.message,
    );
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Reset password',
    description: 'Resets the user password using a valid reset token.',
    response: ResetPasswordResponseDto,
    commonResponses: ['badRequest'],
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.resetPasswordUseCase.execute({
      token: dto.token,
      password: dto.password,
    });

    return ResponseHelper.success({ completed: true }, result.message);
  }

  private setAuthenticatedSession(request: FastifyRequest, user: UserResponse) {
    request.session.userId = user.id;
    request.session.email = user.email;
    request.session.name = user.name;
    request.session.currentOrganizationId = undefined;
    request.session.currentOrganizationName = undefined;
    request.session.currentOrganizationRole = undefined;
    request.session.authenticated = true;

    this.sessionStorageService.updateStorageData({
      userId: user.id,
      email: user.email,
      name: user.name,
      currentOrganizationId: undefined,
      currentOrganizationName: undefined,
      currentOrganizationRole: undefined,
      authenticated: true,
    });
  }

  private clearAuthenticatedSessionContext() {
    this.sessionStorageService.setStorageData({});
  }

  private clearSessionCookie(reply: FastifyReply) {
    reply.clearCookie(envConfig.session.cookie.name, {
      path: envConfig.session.cookie.path,
      domain: envConfig.session.cookie.domain,
    });
  }
}
