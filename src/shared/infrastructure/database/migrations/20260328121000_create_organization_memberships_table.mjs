/** @param {import('knex').Knex} knex */
export async function up(knex) {
  await knex.schema.createTable('organization_memberships', (table) => {
    table.bigInteger('id').primary();
    table
      .bigInteger('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');
    table
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('role', 32).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(
      ['organization_id', 'user_id'],
      'UQ_organization_memberships_organization_user',
    );
    table.index(['organization_id'], 'IDX_organization_memberships_organization');
    table.index(['user_id'], 'IDX_organization_memberships_user');
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.dropTableIfExists('organization_memberships');
}
