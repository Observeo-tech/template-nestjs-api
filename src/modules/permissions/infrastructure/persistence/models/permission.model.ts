import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const PermissionModel = defineModel({
  name: 'Permission',
  table: 'permissions',
  columns: {
    id: snowflakeIdColumn().primary(),
    featureId: snowflakeIdColumn(),
    actionId: snowflakeIdColumn(),
    code: col.text(),
    description: col.text().nullable(),
    createdAt: col.timestamp().generated(),
    updatedAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type PermissionRecord = InferModelShape<typeof PermissionModel>;
