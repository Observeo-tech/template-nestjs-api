import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
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
import { OBJX_SESSION } from '@/shared/infrastructure/database/database.tokens';
import type { ObjxSession } from '@/shared/infrastructure/database/database.types';
import {
  OrganizationMembershipModel,
  type OrganizationMembershipRecord,
} from '@/modules/organizations/infrastructure/persistence/models/organization-membership.model';
import { OrganizationMembershipRoleModel } from '@/modules/organizations/infrastructure/persistence/models/organization-membership-role.model';
import {
  OrganizationUserPermissionModel,
} from '../models/organization-user-permission.model';
import { PermissionActionModel } from '../models/permission-action.model';
import { PermissionFeatureModel } from '../models/permission-feature.model';
import { PermissionModel } from '../models/permission.model';
import { RolePermissionModel } from '../models/role-permission.model';
import { RoleModel, type RoleRecord } from '../models/role.model';

@Injectable()
export class PermissionsRepository implements IPermissionsRepository {
  constructor(
    @Inject(OBJX_SESSION)
    private readonly objxSession: ObjxSession,
  ) {}

  async getCatalog(): Promise<PermissionCatalog> {
    const [features, actions, permissions, roles] = await Promise.all([
      this.objxSession.execute(
        PermissionFeatureModel
          .query()
          .orderBy(({ code }) => code, 'asc'),
      ),
      this.objxSession.execute(
        PermissionActionModel
          .query()
          .orderBy(({ code }) => code, 'asc'),
      ),
      this.objxSession.execute(
        PermissionModel
          .query()
          .orderBy(({ code }) => code, 'asc'),
      ),
      this.objxSession.execute(
        RoleModel
          .query()
          .orderBy(({ code }) => code, 'asc'),
      ),
    ]);
    const featureCodeById = new Map(
      features.map((feature) => [feature.id, feature.code]),
    );
    const actionCodeById = new Map(
      actions.map((action) => [action.id, action.code]),
    );

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
          featureCode: featureCodeById.get(permission.featureId) ?? '',
          actionCode: actionCodeById.get(permission.actionId) ?? '',
          description: permission.description,
        }))
        .filter(
          (permission) =>
            permission.featureCode.length > 0 && permission.actionCode.length > 0,
        ),
      roles: roles
        .filter((role) => isSystemRoleCode(role.code))
        .map((role) => ({
          code: role.code as SystemRoleCode,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
        })),
    };
  }

  async getPermissionSnapshotForUser(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationPermissionSnapshot | null> {
    return this.objxSession.transaction(async (trxSession) => {
      const membership = await this.findMembership(
        trxSession,
        userId,
        organizationId,
      );

      if (!membership) {
        return null;
      }

      return this.buildSnapshot(trxSession, membership, userId, organizationId);
    });
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

    return this.objxSession.transaction(async (trxSession) => {
      const membership = await this.findMembership(
        trxSession,
        userId,
        organizationId,
      );

      if (!membership) {
        return null;
      }

      const roleRows = normalizedRoleCodes.length > 0
        ? await trxSession.execute(
          RoleModel
            .query()
            .where(({ code }, op) => op.in(code, normalizedRoleCodes))
            .orderBy(({ code }) => code, 'asc'),
        )
        : [];
      const permissionRows = normalizedOverrides.length > 0
        ? await trxSession.execute(
          PermissionModel
            .query()
            .where(({ code }, op) =>
              op.in(
                code,
                normalizedOverrides.map((override) => override.permissionCode),
              ),
            )
            .orderBy(({ code }) => code, 'asc'),
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

      await trxSession.execute(
        OrganizationMembershipRoleModel
          .delete()
          .where(({ membershipId }, op) => op.eq(membershipId, membership.id)),
      );

      if (roleRows.length > 0) {
        await trxSession.execute(
          OrganizationMembershipRoleModel.insert(
            roleRows.map((role) => ({
              id: generateSnowflakeId(),
              membershipId: membership.id,
              roleId: role.id,
            })),
          ),
        );
      }

      await trxSession.execute(
        OrganizationUserPermissionModel
          .delete()
          .where(({ organizationId: currentOrganizationId, userId: currentUserId }, op) =>
            op.and(
              op.eq(currentOrganizationId, organizationId),
              op.eq(currentUserId, userId),
            ),
          ),
      );

      if (normalizedOverrides.length > 0) {
        const permissionIdByCode = new Map(
          permissionRows.map((permission) => [permission.code, permission.id]),
        );

        await trxSession.execute(
          OrganizationUserPermissionModel.insert(
            normalizedOverrides.map((override) => ({
              id: generateSnowflakeId(),
              organizationId,
              userId,
              permissionId: permissionIdByCode.get(override.permissionCode)!,
              effect: override.effect,
            })),
          ),
        );
      }

      const legacyRole = resolveLegacyOrganizationMembershipRole(
        normalizedRoleCodes,
      );

      await trxSession.execute(
        OrganizationMembershipModel
          .update({ role: legacyRole })
          .where(({ id }, op) => op.eq(id, membership.id)),
      );

      return this.buildSnapshot(
        trxSession,
        { ...membership, role: legacyRole },
        userId,
        organizationId,
      );
    });
  }

  private async findMembership(
    executor: ObjxSession,
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembershipRecord | null> {
    const rows = await executor.execute(
      OrganizationMembershipModel
        .query()
        .where(({ userId: membershipUserId, organizationId: membershipOrganizationId }, op) =>
          op.and(
            op.eq(membershipUserId, userId),
            op.eq(membershipOrganizationId, organizationId),
          ),
        )
        .limit(1),
    );

    return rows[0] ?? null;
  }

  private async buildSnapshot(
    executor: ObjxSession,
    membership: OrganizationMembershipRecord,
    userId: string,
    organizationId: string,
  ): Promise<OrganizationPermissionSnapshot> {
    const [membershipRoleRows, overrideRows] = await Promise.all([
      executor.execute(
        OrganizationMembershipRoleModel
          .query()
          .where(({ membershipId }, op) => op.eq(membershipId, membership.id)),
      ),
      executor.execute(
        OrganizationUserPermissionModel
          .query()
          .where(({ organizationId: currentOrganizationId, userId: currentUserId }, op) =>
            op.and(
              op.eq(currentOrganizationId, organizationId),
              op.eq(currentUserId, userId),
            ),
          ),
      ),
    ]);
    const roleIds = Array.from(
      new Set(membershipRoleRows.map((membershipRole) => membershipRole.roleId)),
    );
    const [roleRows, rolePermissionRows] = await Promise.all([
      roleIds.length > 0
        ? executor.execute(
          RoleModel
            .query()
            .where(({ id }, op) => op.in(id, roleIds))
            .orderBy(({ code }) => code, 'asc'),
        )
        : Promise.resolve([] as readonly RoleRecord[]),
      roleIds.length > 0
        ? executor.execute(
          RolePermissionModel
            .query()
            .where(({ roleId }, op) => op.in(roleId, roleIds)),
        )
        : Promise.resolve([]),
    ]);
    const permissionIds = Array.from(
      new Set([
        ...overrideRows.map((override) => override.permissionId),
        ...rolePermissionRows.map((rolePermission) => rolePermission.permissionId),
      ]),
    );
    const permissionRows = permissionIds.length > 0
      ? await executor.execute(
        PermissionModel
          .query()
          .where(({ id }, op) => op.in(id, permissionIds)),
      )
      : [];
    const permissionCodeById = new Map(
      permissionRows.map((permission) => [permission.id, permission.code]),
    );

    const roleCodes = roleRows
      .map((role) => role.code)
      .filter(isSystemRoleCode)
      .sort();
    const overrides = overrideRows
      .map((override) => ({
        permissionCode: permissionCodeById.get(override.permissionId),
        effect: override.effect,
      }))
      .filter(
        (override): override is {
          permissionCode: PermissionCode;
          effect: 'allow' | 'deny';
        } =>
          !!override.permissionCode &&
          isPermissionCode(override.permissionCode) &&
          (override.effect === 'allow' || override.effect === 'deny'),
      )
      .sort((a, b) => a.permissionCode.localeCompare(b.permissionCode));
    const effectivePermissionCodes = new Set<PermissionCode>(
      rolePermissionRows
        .map((rolePermission) => permissionCodeById.get(rolePermission.permissionId))
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
