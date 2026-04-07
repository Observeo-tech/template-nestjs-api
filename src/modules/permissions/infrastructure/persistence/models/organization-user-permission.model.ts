import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const OrganizationUserPermissionModel = defineModel({
  name: 'OrganizationUserPermission',
  table: 'organization_user_permissions',
  columns: {
    id: snowflakeIdColumn().primary(),
    organizationId: snowflakeIdColumn(),
    userId: snowflakeIdColumn(),
    permissionId: snowflakeIdColumn(),
    effect: col.text(),
    createdAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type OrganizationUserPermissionRecord = InferModelShape<
  typeof OrganizationUserPermissionModel
>;
