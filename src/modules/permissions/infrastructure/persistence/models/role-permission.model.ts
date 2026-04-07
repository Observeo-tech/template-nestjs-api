import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const RolePermissionModel = defineModel({
  name: 'RolePermission',
  table: 'role_permissions',
  columns: {
    id: snowflakeIdColumn().primary(),
    roleId: snowflakeIdColumn(),
    permissionId: snowflakeIdColumn(),
    createdAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type RolePermissionRecord = InferModelShape<typeof RolePermissionModel>;
