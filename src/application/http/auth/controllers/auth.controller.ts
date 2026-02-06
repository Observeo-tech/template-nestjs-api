import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUseCase } from '@/domain/auth/use-cases';
import { AuthResponseDto, LoginDto } from '../dtos';
import { Public } from '../../common/decorators';

/**
 * Authentication Controller
 *
 * Handles authentication endpoints following Clean Architecture:
 * - Controller (Presentation Layer)
 * - Use Cases (Business Logic Layer)
 * - Repositories (Data Layer)
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  /**
   * Login endpoint
   *
   * Authenticates a user with email and password.
   * Uses Zod for automatic request validation.
   *
   * @param loginDto - Login credentials (email, password)
   * @returns User data and authentication token
   *
   * @example
   * POST /auth/login
   * {
   *   "email": "user@example.com",
   *   "password": "myPassword123"
   * }
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password. Returns user data without sensitive information.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const result = await this.loginUseCase.execute({
      email: loginDto.email,
      password: loginDto.password,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      },
      token: result.token,
      message: 'Login successful',
    };
  }
}
