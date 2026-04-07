import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const OrganizationModel = defineModel({
  name: 'Organization',
  table: 'organizations',
  columns: {
    id: snowflakeIdColumn().primary(),
    name: col.text(),
    createdAt: col.timestamp().generated(),
    updatedAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type OrganizationRecord = InferModelShape<typeof OrganizationModel>;
