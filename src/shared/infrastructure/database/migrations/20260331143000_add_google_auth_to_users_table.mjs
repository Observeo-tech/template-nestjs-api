/** @param {import('knex').Knex} knex */
export async function up(knex) {
  await knex.raw('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');

  await knex.schema.alterTable('users', (table) => {
    table.string('google_id', 255).nullable();
    table.text('avatar_url').nullable();
    table.unique(['google_id'], 'UQ_users_google_id');
    table.index(['google_id'], 'IDX_users_google_id');
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex('users')
    .whereNull('password')
    .update({
      password: '__google_auth_removed__',
      updated_at: knex.fn.now(),
    });

  await knex.schema.alterTable('users', (table) => {
    table.dropIndex(['google_id'], 'IDX_users_google_id');
    table.dropUnique(['google_id'], 'UQ_users_google_id');
    table.dropColumn('google_id');
    table.dropColumn('avatar_url');
  });

  await knex.raw('ALTER TABLE users ALTER COLUMN password SET NOT NULL');
}
