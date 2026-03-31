import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GoogleLoginSchema = z.object({
  idToken: z
    .string({
      message: 'Google ID token is required',
    })
    .trim()
    .min(1, 'Google ID token is required'),
});

export class GoogleLoginDto extends createZodDto(GoogleLoginSchema) {}
