import { col, defineModel, type InferModelShape } from '@qbobjx/core';
import { createSnakeCaseNamingPlugin } from '@qbobjx/plugins';
import { snowflakeIdColumn } from '@/shared/infrastructure/database/objx-columns';

export const OrganizationReportSettingsModel = defineModel({
  name: 'OrganizationReportSettings',
  table: 'organization_report_settings',
  columns: {
    organizationId: snowflakeIdColumn().primary(),
    displayName: col.text().nullable(),
    headerText: col.text().nullable(),
    footerText: col.text().nullable(),
    legalText: col.text().nullable(),
    primaryColor: col.text().nullable(),
    secondaryColor: col.text().nullable(),
    logoFileName: col.text().nullable(),
    logoContentType: col.text().nullable(),
    logoSizeBytes: col.int().nullable(),
    logoBlob: col.custom<Buffer, 'bytea'>('bytea').nullable(),
    updatedBy: snowflakeIdColumn().nullable(),
    createdAt: col.timestamp().generated(),
    updatedAt: col.timestamp().generated(),
  },
  plugins: [createSnakeCaseNamingPlugin()],
});

export type OrganizationReportSettingsRecord = InferModelShape<
  typeof OrganizationReportSettingsModel
>;
