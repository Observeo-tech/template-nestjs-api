import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '20260328123000_create_organization_report_settings_table',
  description: 'create organization report settings table',
  up: [
    `create table organization_report_settings (
      organization_id bigint primary key references organizations(id) on delete cascade,
      display_name varchar(255) null,
      header_text text null,
      footer_text text null,
      legal_text text null,
      primary_color varchar(32) null,
      secondary_color varchar(32) null,
      logo_file_name varchar(255) null,
      logo_content_type varchar(128) null,
      logo_size_bytes integer null,
      logo_blob bytea null,
      updated_by bigint null references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );`,
    'create index "IDX_organization_report_settings_updated_by" on organization_report_settings (updated_by);',
  ],
  down: [
    'drop table if exists organization_report_settings;',
  ],
});
