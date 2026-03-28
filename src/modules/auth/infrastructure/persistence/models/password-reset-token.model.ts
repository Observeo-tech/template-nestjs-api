import { PasswordResetToken } from '@/modules/auth/domain/entities/password-reset-token.entity';
import { SnowflakeModel } from '@/shared/infrastructure/database/models/snowflake.model';

const PASSWORD_RESET_TOKENS_TABLE = 'password_reset_tokens';

export class PasswordResetTokenModel extends SnowflakeModel {
  declare id: string;
  userId!: string;
  tokenHash!: string;
  expiresAt!: Date;
  createdAt!: Date;

  static tableName = PASSWORD_RESET_TOKENS_TABLE;
  static idColumn = 'id';

  $parseDatabaseJson(json: Record<string, unknown>): Record<string, unknown> {
    const parsed = super.$parseDatabaseJson(json);

    if (parsed.userId !== undefined && parsed.userId !== null) {
      parsed.userId = String(parsed.userId);
    }

    if (typeof parsed.expiresAt === 'string') {
      parsed.expiresAt = new Date(parsed.expiresAt);
    }

    if (typeof parsed.createdAt === 'string') {
      parsed.createdAt = new Date(parsed.createdAt);
    }

    return parsed;
  }

  toDomain(): PasswordResetToken {
    return new PasswordResetToken(this);
  }
}
