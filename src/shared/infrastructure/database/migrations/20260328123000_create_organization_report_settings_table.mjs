/** @param {import('knex').Knex} knex */
export async function up(knex) {
  await knex.schema.createTable('organization_report_settings', (table) => {
    table
      .bigInteger('organization_id')
      .primary()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');
    table.string('display_name', 255).nullable();
    table.text('header_text').nullable();
    table.text('footer_text').nullable();
    table.text('legal_text').nullable();
    table.string('primary_color', 32).nullable();
    table.string('secondary_color', 32).nullable();
    table.string('logo_file_name', 255).nullable();
    table.string('logo_content_type', 128).nullable();
    table.integer('logo_size_bytes').nullable();
    table.binary('logo_blob').nullable();
    table
      .bigInteger('updated_by')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['updated_by'], 'IDX_organization_report_settings_updated_by');
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.dropTableIfExists('organization_report_settings');
}
