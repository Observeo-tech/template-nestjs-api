import bcrypt from 'bcrypt';
import { defineSeed } from '@qbobjx/codegen';

const DEFAULT_ADMIN_EMAIL = 'admin@teste.local';
const DEFAULT_ADMIN_NAME = 'Administrador';
const DEFAULT_ADMIN_PASSWORD = 'admin123456';
const DEFAULT_ADMIN_ID = '710000000000000001';
const DEFAULT_ORGANIZATION_ID = '710000000000000101';
const DEFAULT_ORGANIZATION_MEMBERSHIP_ID = '710000000000000201';

function resolveAdminSeedConfig() {
  return {
    email: process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
    name: process.env.SEED_ADMIN_NAME || DEFAULT_ADMIN_NAME,
    password: process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  };
}

function resolveOrganizationSeedConfig() {
  return {
    name: process.env.SEED_ORGANIZATION_NAME?.trim() || '',
  };
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export default defineSeed({
  name: '20260327120000_seed_bootstrap_admin_user',
  description: 'seed bootstrap admin user',
  async run(context) {
    const admin = resolveAdminSeedConfig();
    const organization = resolveOrganizationSeedConfig();
    const hashedPassword = await bcrypt.hash(admin.password, 12);

    await context.execute(`
      insert into users (
        id,
        email,
        name,
        password
      )
      values (
        ${DEFAULT_ADMIN_ID},
        ${sqlString(admin.email)},
        ${sqlString(admin.name)},
        ${sqlString(hashedPassword)}
      )
      on conflict (email) do update
      set
        name = excluded.name,
        password = excluded.password,
        updated_at = now();
    `);

    if (!organization.name) {
      return;
    }

    await context.execute(`
      insert into organizations (
        id,
        name
      )
      values (
        ${DEFAULT_ORGANIZATION_ID},
        ${sqlString(organization.name)}
      )
      on conflict (id) do update
      set
        name = excluded.name,
        updated_at = now();
    `);

    await context.execute(`
      insert into organization_memberships (
        id,
        organization_id,
        user_id,
        role
      )
      values (
        ${DEFAULT_ORGANIZATION_MEMBERSHIP_ID},
        ${DEFAULT_ORGANIZATION_ID},
        ${DEFAULT_ADMIN_ID},
        'owner'
      )
      on conflict (id) do update
      set
        organization_id = excluded.organization_id,
        user_id = excluded.user_id,
        role = excluded.role;
    `);
  },
  async revert(context) {
    const admin = resolveAdminSeedConfig();
    const organization = resolveOrganizationSeedConfig();

    if (organization.name) {
      await context.execute(`
        delete from organization_memberships
        where id = ${DEFAULT_ORGANIZATION_MEMBERSHIP_ID};
      `);

      await context.execute(`
        delete from organizations
        where id = ${DEFAULT_ORGANIZATION_ID};
      `);
    }

    await context.execute(`
      delete from users
      where email = ${sqlString(admin.email)};
    `);
  },
});
