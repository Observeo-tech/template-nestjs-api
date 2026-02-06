import type { Knex } from "knex";

/**
 * Create users table migration
 *
 * Creates the users table with:
 * - UUID primary key
 * - Email (unique)
 * - Password (hashed with bcrypt)
 * - Name
 * - Timestamps
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('name', 255).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('email');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}

