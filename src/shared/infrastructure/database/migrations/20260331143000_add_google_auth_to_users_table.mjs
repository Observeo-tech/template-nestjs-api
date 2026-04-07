import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '20260331143000_add_google_auth_to_users_table',
  description: 'add google auth to users table',
  up: [
    'alter table users alter column password drop not null;',
    'alter table users add column google_id varchar(255) null;',
    'alter table users add column avatar_url text null;',
    'create unique index "UQ_users_google_id" on users (google_id);',
    'create index "IDX_users_google_id" on users (google_id);',
  ],
  down: [
    `update users
     set password = '__google_auth_removed__',
         updated_at = now()
     where password is null;`,
    'drop index if exists "IDX_users_google_id";',
    'drop index if exists "UQ_users_google_id";',
    'alter table users drop column if exists google_id;',
    'alter table users drop column if exists avatar_url;',
    'alter table users alter column password set not null;',
  ],
});
