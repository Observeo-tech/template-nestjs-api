/** @param {import('knex').Knex} knex */
export async function up(knex) {
  await knex.schema.createTable('organizations', (table) => {
    table.bigInteger('id').primary();
    table.string('name', 255).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['name'], 'IDX_organizations_name');
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.dropTableIfExists('organizations');
}
