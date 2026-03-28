import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Knex } from 'knex';
import {
  isPermissionCode,
  isSystemRoleCode,
  resolveLegacyOrganizationMembershipRole,
  type PermissionCode,
  type SystemRoleCode,
} from '@/modules/permissions/application/constants/permissions.constants';
import type {
  IPermissionsRepository,
  OrganizationPermissionSnapshot,
  PermissionCatalog,
  ReplaceOrganizationMemberAccessInput,
} from '@/modules/permissions/domain/repositories/permissions.repository.interface';
import { generateSnowflakeId } from '@/shared/ids/snowflake-id.util';
import { DatabaseRlsContextService } from '@/shared/infrastructure/database/database-rls-context.service';
import { KNEX_CONNECTION } from '@/shared/infrastructure/database/database.constants';

type MembershipRow = {
  id: string;
  role: string;
};

@Injectable()
export class PermissionsRepository implements IPermissionsRepository {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
    private readonly databaseRlsContextService: DatabaseRlsContextService,
  ) {}

  async getCatalog(): Promise<PermissionCatalog> {
    const [features, actions, permissions, roles] = await Promise.all([
      this.knex('permission_features')
        .select('code', 'name', 'description')
        .orderBy('code', 'asc'),
      this.knex('permission_actions')
        .select('code', 'name', 'description')
        .orderBy('code', 'asc'),
      this.knex('permissions as p')
        .select(
          'p.code',
          'p.description',
          {
            featureCode: 'f.code',
          },
          {
            actionCode: 'a.code',
          },
        )
        .join('permission_features as f', 'f.id', 'p.feature_id')
        .join('permission_actions as a', 'a.id', 'p.action_id')
        .orderBy('p.code', 'asc'),
      this.knex('roles')
        .select('code', 'name', 'description', 'is_system')
        .orderBy('code', 'asc'),
    ]);

    return {
      features: features.map((feature) => ({
        code: feature.code,
        name: feature.name,
        description: feature.description,
      })),
      actions: actions.map((action) => ({
        code: action.code,
        name: action.name,
        description: action.description,
      })),
      permissions: permissions
        .filter((permission) => isPermissionCode(permission.code))
        .map((permission) => ({
          code: permission.code as PermissionCode,
          featureCode: permission.featureCode,
          actionCode: permission.actionCode,
          description: permission.description,
        })),
      roles: roles
        .filter((role) => isSystemRoleCode(role.code))
        .map((role) => ({
          code: role.code as SystemRoleCode,
          name: role.name,
          description: role.description,
          isSystem: Boolean(role.isSystem),
        })),
    };
  }

  async getPermissionSnapshotForUser(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationPermissionSnapshot | null> {
    const membership = await this.findMembership(
      this.knex,
      userId,
      organizationId,
    );

    if (!membership) {
      return null;
    }

    return this.buildSnapshot(this.knex, membership, userId, organizationId);
  }

  async replaceOrganizationMemberAccess(
    userId: string,
    organizationId: string,
    input: ReplaceOrganizationMemberAccessInput,
  ): Promise<OrganizationPermissionSnapshot | null> {
    const normalizedRoleCodes = Array.from(new Set(input.roleCodes));
    const normalizedOverrides = Array.from(
      new Map(
        input.overrides.map((override) => [
          override.permissionCode,
          override,
        ]),
      ).values(),
    );

    const membership = await this.findMembership(
      this.knex,
      userId,
      organizationId,
    );

    if (!membership) {
      return null;
    }

    return this.knex.transaction(async (trx) => {
      await this.databaseRlsContextService.applyToTransaction(trx);

      const roleRows = normalizedRoleCodes.length > 0
        ? await trx('roles')
          .select('id', 'code')
          .whereIn('code', normalizedRoleCodes)
        : [];
      const permissionRows = normalizedOverrides.length > 0
        ? await trx('permissions')
          .select('id', 'code')
          .whereIn(
            'code',
            normalizedOverrides.map((override) => override.permissionCode),
          )
        : [];

      if (roleRows.length !== normalizedRoleCodes.length) {
        const knownRoleCodes = new Set(roleRows.map((role) => role.code));
        const invalidRoleCodes = normalizedRoleCodes.filter(
          (roleCode) => !knownRoleCodes.has(roleCode),
        );
        throw new BadRequestException(
          `Unknown role codes: ${invalidRoleCodes.join(', ')}`,
        );
      }

      if (permissionRows.length !== normalizedOverrides.length) {
        const knownPermissionCodes = new Set(
          permissionRows.map((permission) => permission.code),
        );
        const invalidPermissionCodes = normalizedOverrides
          .map((override) => override.permissionCode)
          .filter((permissionCode) => !knownPermissionCodes.has(permissionCode));
        throw new BadRequestException(
          `Unknown permission codes: ${invalidPermissionCodes.join(', ')}`,
        );
      }

      await trx('organization_membership_roles')
        .where({ membership_id: membership.id })
        .delete();

      if (roleRows.length > 0) {
        await trx('organization_membership_roles').insert(
          roleRows.map((role) => ({
            id: generateSnowflakeId(),
            membership_id: membership.id,
            role_id: role.id,
          })),
        );
      }

      await trx('organization_user_permissions')
        .where({
          organization_id: organizationId,
          user_id: userId,
        })
        .delete();

      if (normalizedOverrides.length > 0) {
        const permissionIdByCode = new Map(
          permissionRows.map((permission) => [permission.code, permission.id]),
        );

        await trx('organization_user_permissions').insert(
          normalizedOverrides.map((override) => ({
            id: generateSnowflakeId(),
            organization_id: organizationId,
            user_id: userId,
            permission_id: permissionIdByCode.get(override.permissionCode),
            effect: override.effect,
          })),
        );
      }

      const legacyRole = resolveLegacyOrganizationMembershipRole(
        normalizedRoleCodes,
      );

      await trx('organization_memberships')
        .where({ id: membership.id })
        .update({ role: legacyRole });

      return this.buildSnapshot(
        trx,
        { ...membership, role: legacyRole },
        userId,
        organizationId,
      );
    });
  }

  private async findMembership(
    executor: Knex | Knex.Transaction,
    userId: string,
    organizationId: string,
  ): Promise<MembershipRow | undefined> {
    return executor('organization_memberships')
      .select('id', 'role')
      .where({
        user_id: userId,
        organization_id: organizationId,
      })
      .first();
  }

  private async buildSnapshot(
    executor: Knex | Knex.Transaction,
    membership: MembershipRow,
    userId: string,
    organizationId: string,
  ): Promise<OrganizationPermissionSnapshot> {
    const [roleRows, overrideRows, inheritedPermissionRows] = await Promise.all([
      executor('organization_membership_roles as omr')
        .join('roles as r', 'r.id', 'omr.role_id')
        .select('r.code')
        .where('omr.membership_id', membership.id)
        .orderBy('r.code', 'asc'),
      executor('organization_user_permissions as oup')
        .join('permissions as p', 'p.id', 'oup.permission_id')
        .select('p.code as permission_code', 'oup.effect')
        .where('oup.organization_id', organizationId)
        .where('oup.user_id', userId)
        .orderBy('p.code', 'asc'),
      executor('organization_membership_roles as omr')
        .join('role_permissions as rp', 'rp.role_id', 'omr.role_id')
        .join('permissions as p', 'p.id', 'rp.permission_id')
        .distinct('p.code')
        .where('omr.membership_id', membership.id)
        .orderBy('p.code', 'asc'),
    ]);

    const roleCodes = roleRows
      .map((role) => role.code)
      .filter(isSystemRoleCode);
    const overrides = overrideRows
      .map((override) => ({
        permissionCode: override.permissionCode,
        effect: override.effect,
      }))
      .filter(
        (override): override is {
          permissionCode: PermissionCode;
          effect: 'allow' | 'deny';
        } =>
          isPermissionCode(override.permissionCode) &&
          (override.effect === 'allow' || override.effect === 'deny'),
      );
    const effectivePermissionCodes = new Set<PermissionCode>(
      inheritedPermissionRows
        .map((permission) => permission.code)
        .filter(isPermissionCode),
    );

    overrides.forEach((override) => {
      if (override.effect === 'allow') {
        effectivePermissionCodes.add(override.permissionCode);
        return;
      }

      effectivePermissionCodes.delete(override.permissionCode);
    });

    return {
      userId,
      organizationId,
      legacyRole: membership.role === 'owner' ? 'owner' : 'member',
      roleCodes,
      overrides,
      effectivePermissionCodes: Array.from(effectivePermissionCodes).sort(),
    };
  }
}
