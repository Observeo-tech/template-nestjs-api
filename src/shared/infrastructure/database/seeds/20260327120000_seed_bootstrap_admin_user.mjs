import bcrypt from 'bcrypt';

const DEFAULT_ADMIN_EMAIL = 'admin@teste.local';
const DEFAULT_ADMIN_NAME = 'Administrador';
const DEFAULT_ADMIN_PASSWORD = 'admin123456';
const DEFAULT_ADMIN_ID = '710000000000000001';
const DEFAULT_ORGANIZATION_ID = '710000000000000101';
const DEFAULT_ORGANIZATION_MEMBERSHIP_ID = '710000000000000201';

/** @returns {{ email: string, name: string, password: string }} */
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

/** @param {import('knex').Knex} knex */
export async function seed(knex) {
  const admin = resolveAdminSeedConfig();
  const organization = resolveOrganizationSeedConfig();
  const hashedPassword = await bcrypt.hash(admin.password, 12);

  await knex('users')
    .insert({
      id: DEFAULT_ADMIN_ID,
      email: admin.email,
      name: admin.name,
      password: hashedPassword,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .onConflict('email')
    .merge({
      name: admin.name,
      password: hashedPassword,
      updated_at: knex.fn.now(),
    });

  if (organization.name) {
    await knex('organizations')
      .insert({
        id: DEFAULT_ORGANIZATION_ID,
        name: organization.name,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .onConflict('id')
      .merge({
        name: organization.name,
        updated_at: knex.fn.now(),
      });

    await knex('organization_memberships')
      .insert({
        id: DEFAULT_ORGANIZATION_MEMBERSHIP_ID,
        organization_id: DEFAULT_ORGANIZATION_ID,
        user_id: DEFAULT_ADMIN_ID,
        role: 'owner',
        created_at: knex.fn.now(),
      })
      .onConflict('id')
      .merge({
        organization_id: DEFAULT_ORGANIZATION_ID,
        user_id: DEFAULT_ADMIN_ID,
        role: 'owner',
      });
  }

  return {
    email: admin.email,
    organizationId: organization.name ? DEFAULT_ORGANIZATION_ID : null,
  };
}

/**
 * @param {import('knex').Knex} knex
 * @param {{ email?: string, organizationId?: string | null } | null | undefined} meta
 */
export async function down(knex, meta) {
  const admin = resolveAdminSeedConfig();
  const organization = resolveOrganizationSeedConfig();
  const email = meta?.email || admin.email;
  const organizationId = meta?.organizationId || (organization.name ? DEFAULT_ORGANIZATION_ID : null);

  if (organizationId) {
    await knex('organization_memberships')
      .where({ id: DEFAULT_ORGANIZATION_MEMBERSHIP_ID })
      .delete();

    await knex('organizations')
      .where({ id: organizationId })
      .delete();
  }

  await knex('users')
    .where({ email })
    .delete();
}
