import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserResponseSchema } from '@/modules/users/presentation/http/dtos/user-response.dto';

/**
 * Zod schema for authentication response
 *
 * Returns authenticated user data
 */
export const AuthResponseSchema = z.object({
  user: UserResponseSchema,
  message: z.string().default('Authentication successful'),
});

/**
 * DTO class for authentication response
 *
 * @example
 * ```json
 * {
 *   "user": {
 *     "id": "1925012345678901248",
 *     "email": "user@example.com",
 *     "name": "Jane Doe"
 *   },
 *   "message": "Authentication successful"
 * }
 * ```
 */
export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}
