import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '20260326120000_create_password_reset_tokens_table',
  description: 'create password reset tokens table',
  up: [
    `create table password_reset_tokens (
      id bigint primary key,
      user_id bigint not null references users(id) on delete cascade,
      token_hash varchar(255) not null unique,
      expires_at timestamp not null,
      created_at timestamp not null default now()
    );`,
    'create index "IDX_password_reset_tokens_user_id" on password_reset_tokens (user_id);',
    'create index "IDX_password_reset_tokens_expires_at" on password_reset_tokens (expires_at);',
  ],
  down: [
    'drop table if exists password_reset_tokens;',
  ],
});
