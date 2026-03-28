/** @param {import('knex').Knex} knex */
export async function up(knex) {
  await knex.schema.createTable('permission_features', (table) => {
    table.bigInteger('id').primary();
    table.string('code', 64).notNullable().unique();
    table.string('name', 128).notNullable();
    table.text('description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['code'], 'IDX_permission_features_code');
  });

  await knex.schema.createTable('permission_actions', (table) => {
    table.bigInteger('id').primary();
    table.string('code', 64).notNullable().unique();
    table.string('name', 128).notNullable();
    table.text('description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['code'], 'IDX_permission_actions_code');
  });

  await knex.schema.createTable('permissions', (table) => {
    table.bigInteger('id').primary();
    table
      .bigInteger('feature_id')
      .notNullable()
      .references('id')
      .inTable('permission_features')
      .onDelete('CASCADE');
    table
      .bigInteger('action_id')
      .notNullable()
      .references('id')
      .inTable('permission_actions')
      .onDelete('CASCADE');
    table.string('code', 128).notNullable().unique();
    table.text('description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['feature_id', 'action_id'], 'UQ_permissions_feature_action');
    table.index(['feature_id'], 'IDX_permissions_feature');
    table.index(['action_id'], 'IDX_permissions_action');
    table.index(['code'], 'IDX_permissions_code');
  });

  await knex.schema.createTable('roles', (table) => {
    table.bigInteger('id').primary();
    table.string('code', 64).notNullable().unique();
    table.string('name', 128).notNullable();
    table.text('description').nullable();
    table.boolean('is_system').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['code'], 'IDX_roles_code');
  });

  await knex.schema.createTable('role_permissions', (table) => {
    table.bigInteger('id').primary();
    table
      .bigInteger('role_id')
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
    table
      .bigInteger('permission_id')
      .notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['role_id', 'permission_id'], 'UQ_role_permissions_role_permission');
    table.index(['role_id'], 'IDX_role_permissions_role');
    table.index(['permission_id'], 'IDX_role_permissions_permission');
  });

  await knex.schema.createTable('organization_membership_roles', (table) => {
    table.bigInteger('id').primary();
    table
      .bigInteger('membership_id')
      .notNullable()
      .references('id')
      .inTable('organization_memberships')
      .onDelete('CASCADE');
    table
      .bigInteger('role_id')
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(
      ['membership_id', 'role_id'],
      'UQ_organization_membership_roles_membership_role',
    );
    table.index(['membership_id'], 'IDX_organization_membership_roles_membership');
    table.index(['role_id'], 'IDX_organization_membership_roles_role');
  });

  await knex.schema.createTable('organization_user_permissions', (table) => {
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
    table
      .bigInteger('permission_id')
      .notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE');
    table.string('effect', 16).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(
      ['organization_id', 'user_id', 'permission_id'],
      'UQ_organization_user_permissions_org_user_permission',
    );
    table.index(['organization_id'], 'IDX_organization_user_permissions_org');
    table.index(['user_id'], 'IDX_organization_user_permissions_user');
    table.index(['permission_id'], 'IDX_organization_user_permissions_permission');
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.dropTableIfExists('organization_user_permissions');
  await knex.schema.dropTableIfExists('organization_membership_roles');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('permission_actions');
  await knex.schema.dropTableIfExists('permission_features');
}
