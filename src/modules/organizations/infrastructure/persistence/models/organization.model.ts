import { Organization } from '@/modules/organizations/domain/entities/organization.entity';
import { SnowflakeModel } from '@/shared/infrastructure/database/models/snowflake.model';

const ORGANIZATIONS_TABLE = 'organizations';

export class OrganizationModel extends SnowflakeModel {
  declare id: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static tableName = ORGANIZATIONS_TABLE;
  static idColumn = 'id';

  $parseDatabaseJson(json: Record<string, unknown>): Record<string, unknown> {
    const parsed = super.$parseDatabaseJson(json);

    if (typeof parsed.createdAt === 'string') {
      parsed.createdAt = new Date(parsed.createdAt);
    }

    if (typeof parsed.updatedAt === 'string') {
      parsed.updatedAt = new Date(parsed.updatedAt);
    }

    return parsed;
  }

  toDomain(): Organization {
    return new Organization(this);
  }
}
