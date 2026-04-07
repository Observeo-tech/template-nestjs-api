import { defineSeed } from '@qbobjx/codegen';

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

function sqlValue(value) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlValues(row) {
  return Object.values(row).map((value) => sqlValue(value)).join(', ');
}

async function upsertByCode(context, tableName, row, mergeColumns) {
  const columns = Object.keys(row).join(', ');
  const mergeAssignments = mergeColumns
    .map((column) => `${column} = excluded.${column}`)
    .concat('updated_at = now()')
    .join(', ');

  await context.execute(`
    insert into ${tableName} (${columns})
    values (${sqlValues(row)})
    on conflict (code) do update
    set ${mergeAssignments};
  `);
}

export default defineSeed({
  name: '20260328124000_seed_permissions_catalog',
  description: 'seed permissions catalog',
  async run(context) {
    for (const feature of FEATURES) {
      await upsertByCode(context, 'permission_features', feature, [
        'name',
        'description',
      ]);
    }

    for (const action of ACTIONS) {
      await upsertByCode(context, 'permission_actions', action, [
        'name',
        'description',
      ]);
    }

    for (const permission of PERMISSIONS) {
      await upsertByCode(
        context,
        'permissions',
        {
          id: permission.id,
          code: permission.code,
          description: permission.description,
          feature_id: permission.featureId,
          action_id: permission.actionId,
        },
        ['description', 'feature_id', 'action_id'],
      );
    }

    for (const role of ROLES) {
      await upsertByCode(
        context,
        'roles',
        {
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
          is_system: true,
        },
        ['name', 'description', 'is_system'],
      );
    }

    const roleIdByCode = Object.fromEntries(ROLES.map((role) => [role.code, role.id]));
    const permissionIdByCode = Object.fromEntries(
      PERMISSIONS.map((permission) => [permission.code, permission.id]),
    );

    for (const [roleCode, permissionCode] of ROLE_PERMISSIONS) {
      await context.execute(`
        insert into role_permissions (
          id,
          role_id,
          permission_id
        )
        values (
          ${generateId()},
          ${roleIdByCode[roleCode]},
          ${permissionIdByCode[permissionCode]}
        )
        on conflict (role_id, permission_id) do nothing;
      `);
    }

    const legacyRoleEntries = Object.entries(LEGACY_ORGANIZATION_ROLE_MAP);

    for (const [legacyRole, systemRoleCode] of legacyRoleEntries) {
      await context.execute(`
        insert into organization_membership_roles (
          id,
          membership_id,
          role_id
        )
        select
          om.id,
          om.id,
          ${roleIdByCode[systemRoleCode]}
        from organization_memberships om
        where om.role = ${sqlValue(legacyRole)}
        on conflict (membership_id, role_id) do nothing;
      `);
    }
  },
  async revert(context) {
    const permissionCodes = PERMISSIONS.map((permission) => permission.code);
    const roleCodes = ROLES.map((role) => role.code);
    const featureCodes = FEATURES.map((feature) => feature.code);
    const actionCodes = ACTIONS.map((action) => action.code);
    const roleCodeList = roleCodes.map((code) => sqlValue(code)).join(', ');
    const permissionCodeList = permissionCodes.map((code) => sqlValue(code)).join(', ');
    const featureCodeList = featureCodes.map((code) => sqlValue(code)).join(', ');
    const actionCodeList = actionCodes.map((code) => sqlValue(code)).join(', ');

    await context.execute(`
      delete from organization_membership_roles
      where role_id in (
        select id from roles where code in (${roleCodeList})
      );
    `);

    await context.execute(`
      delete from role_permissions
      where role_id in (
        select id from roles where code in (${roleCodeList})
      );
    `);

    await context.execute(`
      delete from roles
      where code in (${roleCodeList});
    `);

    await context.execute(`
      delete from organization_user_permissions
      where permission_id in (
        select id from permissions where code in (${permissionCodeList})
      );
    `);

    await context.execute(`
      delete from permissions
      where code in (${permissionCodeList});
    `);

    await context.execute(`
      delete from permission_actions
      where code in (${actionCodeList});
    `);

    await context.execute(`
      delete from permission_features
      where code in (${featureCodeList});
    `);
  },
});
