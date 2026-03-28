import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  userEmailSchema,
  userNameSchema,
  userPasswordSchema,
} from '@/modules/users/presentation/http/dtos/create-user.dto';

export const RegisterSchema = z.object({
  email: userEmailSchema,
  password: userPasswordSchema,
  name: userNameSchema,
});

/**
 * DTO class for register endpoint
 *
 * @example
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "mySecurePassword123",
 *   "name": "Jane Doe"
 * }
 * ```
 */
export class RegisterDto extends createZodDto(RegisterSchema) {}
