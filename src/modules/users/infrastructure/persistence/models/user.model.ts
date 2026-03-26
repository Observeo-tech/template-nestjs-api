import { User } from '@/modules/users/domain/entities/user.entity';
import { Model } from 'objection';

const USERS_TABLE = 'users';

export class UserModel extends Model {
  id!: string;
  email!: string;
  password!: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static tableName = USERS_TABLE;
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

  toDomain(): User {
    return new User(this);
  }
}
