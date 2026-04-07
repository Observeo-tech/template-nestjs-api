import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const PermissionActionModel = defineModel({
  name: 'PermissionAction',
  table: 'permission_actions',
  columns: {
    id: snowflakeIdColumn().primary(),
    code: col.text(),
    name: col.text(),
    description: col.text().nullable(),
    createdAt: col.timestamp().generated(),
    updatedAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type PermissionActionRecord = InferModelShape<typeof PermissionActionModel>;
