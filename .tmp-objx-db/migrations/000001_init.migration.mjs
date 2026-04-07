import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '000001_init',
  description: 'bootstrap tables',
  up: [
    `create table if not exists projects (
      id integer generated always as identity primary key,
      name text not null,
      tenant_id text not null
    );`,
  ],
  down: [
    'drop table if exists projects;',
  ],
});
