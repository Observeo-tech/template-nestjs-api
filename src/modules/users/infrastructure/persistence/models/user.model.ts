import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const UserModel = defineModel({
  name: 'User',
  table: 'users',
  columns: {
    id: snowflakeIdColumn().primary(),
    email: col.text(),
    password: col.text().nullable(),
    googleId: col.text().nullable(),
    avatarUrl: col.text().nullable(),
    name: col.text(),
    createdAt: col.timestamp().generated(),
    updatedAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type UserRecord = InferModelShape<typeof UserModel>;
