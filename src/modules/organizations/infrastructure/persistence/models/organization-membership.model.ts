import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const OrganizationMembershipModel = defineModel({
  name: 'OrganizationMembership',
  table: 'organization_memberships',
  columns: {
    id: snowflakeIdColumn().primary(),
    organizationId: snowflakeIdColumn(),
    userId: snowflakeIdColumn(),
    role: col.text(),
    createdAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type OrganizationMembershipRecord = InferModelShape<
  typeof OrganizationMembershipModel
>;
