import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '20260328120000_create_organizations_table',
  description: 'create organizations table',
  up: [
    `create table organizations (
      id bigint primary key,
      name varchar(255) not null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );`,
    'create index "IDX_organizations_name" on organizations (name);',
  ],
  down: [
    'drop table if exists organizations;',
  ],
});
