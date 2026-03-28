import { SnowflakeModel } from '@/shared/infrastructure/database/models/snowflake.model';

const ORGANIZATION_MEMBERSHIPS_TABLE = 'organization_memberships';

export class OrganizationMembershipModel extends SnowflakeModel {
  declare id: string;
  organizationId!: string;
  userId!: string;
  role!: string;
  createdAt!: Date;

  static tableName = ORGANIZATION_MEMBERSHIPS_TABLE;
  static idColumn = 'id';

  $parseDatabaseJson(json: Record<string, unknown>): Record<string, unknown> {
    const parsed = super.$parseDatabaseJson(json);

    if (parsed.organizationId !== undefined && parsed.organizationId !== null) {
      parsed.organizationId = String(parsed.organizationId);
    }

    if (parsed.userId !== undefined && parsed.userId !== null) {
      parsed.userId = String(parsed.userId);
    }

    if (typeof parsed.createdAt === 'string') {
      parsed.createdAt = new Date(parsed.createdAt);
    }

    return parsed;
  }
}
