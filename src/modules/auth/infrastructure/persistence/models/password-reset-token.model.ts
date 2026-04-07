import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const PasswordResetTokenModel = defineModel({
  name: 'PasswordResetToken',
  table: 'password_reset_tokens',
  columns: {
    id: snowflakeIdColumn().primary(),
    userId: snowflakeIdColumn(),
    tokenHash: col.text(),
    expiresAt: col.timestamp(),
    createdAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type PasswordResetTokenRecord = InferModelShape<
  typeof PasswordResetTokenModel
>;
