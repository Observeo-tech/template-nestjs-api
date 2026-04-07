import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const OrganizationMembershipRoleModel = defineModel({
  name: 'OrganizationMembershipRole',
  table: 'organization_membership_roles',
  columns: {
    id: snowflakeIdColumn().primary(),
    membershipId: snowflakeIdColumn(),
    roleId: snowflakeIdColumn(),
    createdAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type OrganizationMembershipRoleRecord = InferModelShape<
  typeof OrganizationMembershipRoleModel
>;
