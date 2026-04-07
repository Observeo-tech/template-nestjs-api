import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '20260328121000_create_organization_memberships_table',
  description: 'create organization memberships table',
  up: [
    `create table organization_memberships (
      id bigint primary key,
      organization_id bigint not null references organizations(id) on delete cascade,
      user_id bigint not null references users(id) on delete cascade,
      role varchar(32) not null,
      created_at timestamp not null default now(),
      constraint "UQ_organization_memberships_organization_user"
        unique (organization_id, user_id)
    );`,
    'create index "IDX_organization_memberships_organization" on organization_memberships (organization_id);',
    'create index "IDX_organization_memberships_user" on organization_memberships (user_id);',
  ],
  down: [
    'drop table if exists organization_memberships;',
  ],
});
