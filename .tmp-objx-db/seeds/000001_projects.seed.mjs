import { defineSeed } from '@qbobjx/codegen';

export default defineSeed({
  name: '000001_projects',
  description: 'seed initial projects',
  run: [
    `insert into projects (name, tenant_id)
     values ('OBJX Alpha', 'tenant_a');`,
  ],
  revert: [
    "delete from projects where name = 'OBJX Alpha' and tenant_id = 'tenant_a';",
  ],
});
