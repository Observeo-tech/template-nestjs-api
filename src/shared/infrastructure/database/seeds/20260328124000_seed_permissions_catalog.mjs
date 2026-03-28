const FEATURES = [
  {
    id: '710000000000001001',
    code: 'organizations',
    name: 'Organizations',
    description: 'Organization access and workspace selection',
  },
  {
    id: '710000000000001002',
    code: 'organization_members',
    name: 'Organization Members',
    description: 'Manage membership access for the current organization',
  },
  {
    id: '710000000000001003',
    code: 'reports',
    name: 'Reports',
    description: 'Export organization reports',
  },
  {
    id: '710000000000001004',
    code: 'report_settings',
    name: 'Report Settings',
    description: 'Customize report branding for the current organization',
  },
  {
    id: '710000000000001005',
    code: 'users',
    name: 'Users',
    description: 'Read users from the current organization scope',
  },
];

const ACTIONS = [
  {
    id: '710000000000002001',
    code: 'read',
    name: 'Read',
    description: 'Read existing data',
  },
  {
    id: '710000000000002002',
    code: 'create',
    name: 'Create',
    description: 'Create new resources',
  },
  {
    id: '710000000000002003',
    code: 'update',
    name: 'Update',
    description: 'Update existing data',
  },
  {
    id: '710000000000002004',
    code: 'delete',
    name: 'Delete',
    description: 'Delete resources',
  },
  {
    id: '710000000000002005',
    code: 'manage',
    name: 'Manage',
    description: 'Manage access and administration',
  },
  {
    id: '710000000000002006',
    code: 'export',
    name: 'Export',
    description: 'Export data and reports',
  },
];

const PERMISSIONS = [
  {
    id: '710000000000003001',
    code: 'organization_members.manage',
    description: 'Manage members and their access inside the organization',
    featureId: '710000000000001002',
    actionId: '710000000000002005',
  },
  {
    id: '710000000000003002',
    code: 'reports.export',
    description: 'Export organization reports',
    featureId: '710000000000001003',
    actionId: '710000000000002006',
  },
  {
    id: '710000000000003003',
    code: 'report_settings.read',
    description: 'Read report branding settings for the organization',
    featureId: '710000000000001004',
    actionId: '710000000000002001',
  },
  {
    id: '710000000000003004',
    code: 'report_settings.update',
    description: 'Update report branding settings for the organization',
    featureId: '710000000000001004',
    actionId: '710000000000002003',
  },
  {
    id: '710000000000003005',
    code: 'users.read',
    description: 'Read users within the current organization scope',
    featureId: '710000000000001005',
    actionId: '710000000000002001',
  },
];

const ROLES = [
  {
    id: '710000000000004001',
    code: 'org_owner',
    name: 'Organization Owner',
    description: 'Full access within the organization',
  },
  {
    id: '710000000000004002',
    code: 'org_admin',
    name: 'Organization Admin',
    description: 'Administrative access without ownership transfer',
  },
  {
    id: '710000000000004003',
    code: 'org_member',
    name: 'Organization Member',
    description: 'Default member access',
  },
  {
    id: '710000000000004004',
    code: 'org_report_manager',
    name: 'Organization Report Manager',
    description: 'Can export and customize organization reports',
  },
];

const ROLE_PERMISSIONS = [
  ['org_owner', 'organization_members.manage'],
  ['org_owner', 'reports.export'],
  ['org_owner', 'report_settings.read'],
  ['org_owner', 'report_settings.update'],
  ['org_owner', 'users.read'],
  ['org_admin', 'organization_members.manage'],
  ['org_admin', 'reports.export'],
  ['org_admin', 'report_settings.read'],
  ['org_admin', 'report_settings.update'],
  ['org_admin', 'users.read'],
  ['org_member', 'report_settings.read'],
  ['org_report_manager', 'reports.export'],
  ['org_report_manager', 'report_settings.read'],
  ['org_report_manager', 'report_settings.update'],
];

const LEGACY_ORGANIZATION_ROLE_MAP = {
  owner: 'org_owner',
  member: 'org_member',
};

let nextGeneratedId = 710000000000005000n;

function generateId() {
  nextGeneratedId += 1n;
  return nextGeneratedId.toString();
}

/** @param {import('knex').Knex} knex */
export async function seed(knex) {
  await upsertLookupTable(knex, 'permission_features', FEATURES, ['name', 'description']);
  await upsertLookupTable(knex, 'permission_actions', ACTIONS, ['name', 'description']);
  await upsertLookupTable(
    knex,
    'permissions',
    PERMISSIONS.map(({ id, code, description, featureId, actionId }) => ({
      id,
      code,
      description,
      feature_id: featureId,
      action_id: actionId,
    })),
    ['description', 'feature_id', 'action_id'],
  );
  await upsertLookupTable(
    knex,
    'roles',
    ROLES.map(({ id, code, name, description }) => ({
      id,
      code,
      name,
      description,
      is_system: true,
    })),
    ['name', 'description', 'is_system'],
  );

  const roleIdByCode = Object.fromEntries(ROLES.map(role => [role.code, role.id]));
  const permissionIdByCode = Object.fromEntries(
    PERMISSIONS.map(permission => [permission.code, permission.id]),
  );

  for (const [roleCode, permissionCode] of ROLE_PERMISSIONS) {
    const roleId = roleIdByCode[roleCode];
    const permissionId = permissionIdByCode[permissionCode];

    await knex('role_permissions')
      .insert({
        id: generateId(),
        role_id: roleId,
        permission_id: permissionId,
      })
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  const memberships = await knex('organization_memberships')
    .select('id', 'role');

  for (const membership of memberships) {
    const roleCode = LEGACY_ORGANIZATION_ROLE_MAP[membership.role] ?? 'org_member';
    const roleId = roleIdByCode[roleCode];

    await knex('organization_membership_roles')
      .insert({
        id: generateId(),
        membership_id: membership.id,
        role_id: roleId,
      })
      .onConflict(['membership_id', 'role_id'])
      .ignore();
  }

  return {
    featureCodes: FEATURES.map(feature => feature.code),
    permissionCodes: PERMISSIONS.map(permission => permission.code),
    roleCodes: ROLES.map(role => role.code),
  };
}

/**
 * @param {import('knex').Knex} knex
 * @param {{ featureCodes?: string[], permissionCodes?: string[], roleCodes?: string[] } | null | undefined} meta
 */
export async function down(knex, meta) {
  const permissionCodes = meta?.permissionCodes ?? PERMISSIONS.map(permission => permission.code);
  const roleCodes = meta?.roleCodes ?? ROLES.map(role => role.code);
  const featureCodes = meta?.featureCodes ?? FEATURES.map(feature => feature.code);
  const actionCodes = ACTIONS.map(action => action.code);

  const roleRows = await knex('roles')
    .select('id')
    .whereIn('code', roleCodes);
  const roleIds = roleRows.map(row => row.id);

  if (roleIds.length > 0) {
    await knex('organization_membership_roles')
      .whereIn('role_id', roleIds)
      .delete();

    await knex('role_permissions')
      .whereIn('role_id', roleIds)
      .delete();
  }

  await knex('roles')
    .whereIn('code', roleCodes)
    .delete();

  await knex('organization_user_permissions')
    .whereIn(
      'permission_id',
      knex('permissions').select('id').whereIn('code', permissionCodes),
    )
    .delete();

  await knex('permissions')
    .whereIn('code', permissionCodes)
    .delete();

  await knex('permission_actions')
    .whereIn('code', actionCodes)
    .delete();

  await knex('permission_features')
    .whereIn('code', featureCodes)
    .delete();
}

/**
 * @param {import('knex').Knex} knex
 * @param {string} tableName
 * @param {Array<Record<string, unknown>>} rows
 * @param {string[]} mergeColumns
 */
async function upsertLookupTable(knex, tableName, rows, mergeColumns) {
  for (const row of rows) {
    const mergePayload = mergeColumns.reduce((accumulator, column) => {
      accumulator[column] = row[column];
      return accumulator;
    }, { updated_at: knex.fn.now() });

    await knex(tableName)
      .insert(row)
      .onConflict('code')
      .merge(mergePayload);
  }
}
