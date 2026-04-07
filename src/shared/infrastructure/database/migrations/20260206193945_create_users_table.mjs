import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '20260206193945_create_users_table',
  description: 'create users table',
  up: [
    `create table users (
      id bigint primary key,
      email varchar(255) not null unique,
      password varchar(255) not null,
      name varchar(255) not null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );`,
    'create index "IDX_users_email" on users (email);',
  ],
  down: [
    'drop table if exists users;',
  ],
});
