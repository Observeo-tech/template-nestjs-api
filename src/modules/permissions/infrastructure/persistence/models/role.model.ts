import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const RoleModel = defineModel({
  name: 'Role',
  table: 'roles',
  columns: {
    id: snowflakeIdColumn().primary(),
    code: col.text(),
    name: col.text(),
    description: col.text().nullable(),
    isSystem: col.boolean(),
    createdAt: col.timestamp().generated(),
    updatedAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type RoleRecord = InferModelShape<typeof RoleModel>;
