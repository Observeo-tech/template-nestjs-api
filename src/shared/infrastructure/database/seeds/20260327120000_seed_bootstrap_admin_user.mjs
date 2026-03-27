import bcrypt from 'bcrypt';

const DEFAULT_ADMIN_EMAIL = 'admin@cspeixes.local';
const DEFAULT_ADMIN_NAME = 'Administrador';
const DEFAULT_ADMIN_PASSWORD = 'admin123456';

/** @returns {{ email: string, name: string, password: string }} */
function resolveAdminSeedConfig() {
  return {
    email: process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
    name: process.env.SEED_ADMIN_NAME || DEFAULT_ADMIN_NAME,
    password: process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  };
}

/** @param {import('knex').Knex} knex */
export async function seed(knex) {
  const admin = resolveAdminSeedConfig();
  const hashedPassword = await bcrypt.hash(admin.password, 12);

  await knex('users')
    .insert({
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

  return {
    email: admin.email,
  };
}

/**
 * @param {import('knex').Knex} knex
 * @param {{ email?: string } | null | undefined} meta
 */
export async function down(knex, meta) {
  const admin = resolveAdminSeedConfig();
  const email = meta?.email || admin.email;

  await knex('users')
    .where({ email })
    .delete();
}
