import { Injectable } from '@nestjs/common';
import { DEFAULT_ORGANIZATION_OWNER_ROLE_CODE } from '@/modules/permissions/application/constants/permissions.constants';
import type {
  CreateOrganizationData,
  IOrganizationRepository,
  OrganizationAccess,
  OrganizationMembershipRole,
} from '@/modules/organizations/domain/repositories/organization.repository.interface';
import { OrganizationMembershipModel } from '../models/organization-membership.model';
import { OrganizationModel } from '../models/organization.model';

type OrganizationAccessRow = OrganizationModel & {
  membershipRole: OrganizationMembershipRole;
};

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  async createForUser(data: CreateOrganizationData): Promise<OrganizationAccess> {
    const knex = OrganizationModel.knex();

    if (!knex) {
      throw new Error('Objection is not bound to a Knex connection.');
    }

    const role = data.role ?? 'owner';

    return knex.transaction(async (trx) => {
      const organization = await OrganizationModel.query(trx).insertAndFetch({
        name: data.name,
      });

      const membership = await OrganizationMembershipModel.query(trx).insertAndFetch({
        organizationId: organization.id,
        userId: data.userId,
        role,
      });

      const ownerRole = await trx('roles')
        .select('id')
        .where({ code: DEFAULT_ORGANIZATION_OWNER_ROLE_CODE })
        .first();

      if (!ownerRole) {
        throw new Error(
          'Seeded role "org_owner" was not found. Run database seeds before creating organizations.',
        );
      }

      await trx('organization_membership_roles').insert({
        id: generateMembershipRoleId(membership.id),
        membership_id: membership.id,
        role_id: ownerRole.id,
      });

      return {
        organization: organization.toDomain(),
        role,
      };
    });
  }

  async listForUser(userId: string): Promise<OrganizationAccess[]> {
    const rows = await OrganizationModel.query()
      .alias('o')
      .select('o.*')
      .select('m.role as membership_role')
      .join('organization_memberships as m', 'm.organization_id', 'o.id')
      .where('m.user_id', userId)
      .orderBy('o.created_at', 'desc');

    return rows.map((row) => this.mapAccessRow(row as OrganizationAccessRow));
  }

  async findAccessibleByIdForUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationAccess | null> {
    const row = await OrganizationModel.query()
      .alias('o')
      .select('o.*')
      .select('m.role as membership_role')
      .join('organization_memberships as m', 'm.organization_id', 'o.id')
      .where('o.id', organizationId)
      .where('m.user_id', userId)
      .first();

    return row ? this.mapAccessRow(row as OrganizationAccessRow) : null;
  }

  private mapAccessRow(row: OrganizationAccessRow): OrganizationAccess {
    return {
      organization: row.toDomain(),
      role: row.membershipRole,
    };
  }
}

function generateMembershipRoleId(membershipId: string): string {
  return membershipId;
}
