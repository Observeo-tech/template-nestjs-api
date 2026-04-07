import { Inject, Injectable } from '@nestjs/common';
import { DEFAULT_ORGANIZATION_OWNER_ROLE_CODE } from '@/modules/permissions/application/constants/permissions.constants';
import { Organization } from '@/modules/organizations/domain/entities/organization.entity';
import type {
  CreateOrganizationData,
  IOrganizationRepository,
  OrganizationAccess,
  OrganizationMembershipRole,
} from '@/modules/organizations/domain/repositories/organization.repository.interface';
import { generateSnowflakeId } from '@/shared/ids/snowflake-id.util';
import { OBJX_SESSION } from '@/shared/infrastructure/database/database.tokens';
import type { ObjxSession } from '@/shared/infrastructure/database/database.types';
import {
  OrganizationMembershipModel,
  type OrganizationMembershipRecord,
} from '../models/organization-membership.model';
import { OrganizationMembershipRoleModel } from '../models/organization-membership-role.model';
import {
  OrganizationModel,
  type OrganizationRecord,
} from '../models/organization.model';
import { RoleModel } from '@/modules/permissions/infrastructure/persistence/models/role.model';

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(
    @Inject(OBJX_SESSION)
    private readonly objxSession: ObjxSession,
  ) {}

  async createForUser(data: CreateOrganizationData): Promise<OrganizationAccess> {
    const role = data.role ?? 'owner';

    return this.objxSession.transaction(async (trxSession) => {
      const organizationRows = await trxSession.execute(
        OrganizationModel
          .insert({
            id: generateSnowflakeId(),
            name: data.name,
          })
          .returning(({ id, name, createdAt, updatedAt }) => [
            id,
            name,
            createdAt,
            updatedAt,
          ]),
      );
      const organizationRow = organizationRows[0];

      if (!organizationRow) {
        throw new Error('Organization insert did not return a row.');
      }

      const membershipId = generateSnowflakeId();

      const membershipRows = await trxSession.execute(
        OrganizationMembershipModel
          .insert({
            id: membershipId,
            organizationId: organizationRow.id,
            userId: data.userId,
            role,
          })
          .returning(({ id, organizationId, userId, role, createdAt }) => [
            id,
            organizationId,
            userId,
            role,
            createdAt,
          ]),
      );
      const membershipRow = membershipRows[0];

      if (!membershipRow) {
        throw new Error('Organization membership insert did not return a row.');
      }

      const ownerRoleRows = await trxSession.execute(
        RoleModel
          .query()
          .where(({ code }, op) => op.eq(code, DEFAULT_ORGANIZATION_OWNER_ROLE_CODE))
          .limit(1),
      );
      const ownerRole = ownerRoleRows[0];

      if (!ownerRole?.id) {
        throw new Error(
          'Seeded role "org_owner" was not found. Run database seeds before creating organizations.',
        );
      }

      await trxSession.execute(
        OrganizationMembershipRoleModel.insert({
          id: generateMembershipRoleId(membershipRow.id),
          membershipId: membershipRow.id,
          roleId: ownerRole.id,
        }),
      );

      return {
        organization: mapOrganizationRow(organizationRow),
        role,
      };
    });
  }

  async listForUser(userId: string): Promise<OrganizationAccess[]> {
    const memberships = await this.objxSession.execute(
      OrganizationMembershipModel
        .query()
        .where(({ userId: membershipUserId }, op) => op.eq(membershipUserId, userId)),
    );

    if (memberships.length === 0) {
      return [];
    }

    const organizations = await this.objxSession.execute(
      OrganizationModel
        .query()
        .where(({ id }, op) =>
          op.in(
            id,
            Array.from(new Set(memberships.map((membership) => membership.organizationId))),
          ),
        )
        .orderBy(({ createdAt }) => createdAt, 'desc'),
    );
    const membershipByOrganizationId = new Map(
      memberships.map((membership) => [membership.organizationId, membership]),
    );

    return organizations
      .map((organization) => {
        const membership = membershipByOrganizationId.get(organization.id);

        if (!membership) {
          return null;
        }

        return mapAccessRow(organization, membership);
      })
      .filter((access): access is OrganizationAccess => access !== null);
  }

  async findAccessibleByIdForUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationAccess | null> {
    const memberships = await this.objxSession.execute(
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
    const membership = memberships[0];

    if (!membership) {
      return null;
    }

    const organizations = await this.objxSession.execute(
      OrganizationModel
        .query()
        .where(({ id }, op) => op.eq(id, organizationId))
        .limit(1),
    );
    const organization = organizations[0];

    return organization ? mapAccessRow(organization, membership) : null;
  }
}

function generateMembershipRoleId(membershipId: string): string {
  return membershipId;
}

function mapAccessRow(
  organization: OrganizationRecord,
  membership: OrganizationMembershipRecord,
): OrganizationAccess {
  return {
    organization: mapOrganizationRow(organization),
    role: membership.role as OrganizationMembershipRole,
  };
}

function mapOrganizationRow(row: OrganizationRecord): Organization {
  return new Organization({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
