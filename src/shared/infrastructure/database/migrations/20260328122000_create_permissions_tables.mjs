import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '20260328122000_create_permissions_tables',
  description: 'create permissions tables',
  up: [
    `create table permission_features (
      id bigint primary key,
      code varchar(64) not null unique,
      name varchar(128) not null,
      description text null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );`,
    'create index "IDX_permission_features_code" on permission_features (code);',
    `create table permission_actions (
      id bigint primary key,
      code varchar(64) not null unique,
      name varchar(128) not null,
      description text null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );`,
    'create index "IDX_permission_actions_code" on permission_actions (code);',
    `create table permissions (
      id bigint primary key,
      feature_id bigint not null references permission_features(id) on delete cascade,
      action_id bigint not null references permission_actions(id) on delete cascade,
      code varchar(128) not null unique,
      description text null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint "UQ_permissions_feature_action" unique (feature_id, action_id)
    );`,
    'create index "IDX_permissions_feature" on permissions (feature_id);',
    'create index "IDX_permissions_action" on permissions (action_id);',
    'create index "IDX_permissions_code" on permissions (code);',
    `create table roles (
      id bigint primary key,
      code varchar(64) not null unique,
      name varchar(128) not null,
      description text null,
      is_system boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );`,
    'create index "IDX_roles_code" on roles (code);',
    `create table role_permissions (
      id bigint primary key,
      role_id bigint not null references roles(id) on delete cascade,
      permission_id bigint not null references permissions(id) on delete cascade,
      created_at timestamp not null default now(),
      constraint "UQ_role_permissions_role_permission" unique (role_id, permission_id)
    );`,
    'create index "IDX_role_permissions_role" on role_permissions (role_id);',
    'create index "IDX_role_permissions_permission" on role_permissions (permission_id);',
    `create table organization_membership_roles (
      id bigint primary key,
      membership_id bigint not null references organization_memberships(id) on delete cascade,
      role_id bigint not null references roles(id) on delete cascade,
      created_at timestamp not null default now(),
      constraint "UQ_organization_membership_roles_membership_role"
        unique (membership_id, role_id)
    );`,
    'create index "IDX_organization_membership_roles_membership" on organization_membership_roles (membership_id);',
    'create index "IDX_organization_membership_roles_role" on organization_membership_roles (role_id);',
    `create table organization_user_permissions (
      id bigint primary key,
      organization_id bigint not null references organizations(id) on delete cascade,
      user_id bigint not null references users(id) on delete cascade,
      permission_id bigint not null references permissions(id) on delete cascade,
      effect varchar(16) not null,
      created_at timestamp not null default now(),
      constraint "UQ_organization_user_permissions_org_user_permission"
        unique (organization_id, user_id, permission_id)
    );`,
    'create index "IDX_organization_user_permissions_org" on organization_user_permissions (organization_id);',
    'create index "IDX_organization_user_permissions_user" on organization_user_permissions (user_id);',
    'create index "IDX_organization_user_permissions_permission" on organization_user_permissions (permission_id);',
  ],
  down: [
    'drop table if exists organization_user_permissions;',
    'drop table if exists organization_membership_roles;',
    'drop table if exists role_permissions;',
    'drop table if exists roles;',
    'drop table if exists permissions;',
    'drop table if exists permission_actions;',
    'drop table if exists permission_features;',
  ],
});
