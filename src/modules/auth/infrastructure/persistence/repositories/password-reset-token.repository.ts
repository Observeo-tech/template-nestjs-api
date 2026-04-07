import { Inject, Injectable } from '@nestjs/common';
import { PasswordResetToken } from '@/modules/auth/domain/entities/password-reset-token.entity';
import type {
  CreatePasswordResetTokenData,
  IPasswordResetTokenRepository,
} from '@/modules/auth/domain/repositories/password-reset-token.repository.interface';
import { generateSnowflakeId } from '@/shared/ids/snowflake-id.util';
import { OBJX_SESSION } from '@/shared/infrastructure/database/database.tokens';
import type { ObjxSession } from '@/shared/infrastructure/database/database.types';
import {
  PasswordResetTokenModel,
  type PasswordResetTokenRecord,
} from '../models/password-reset-token.model';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @Inject(OBJX_SESSION)
    private readonly objxSession: ObjxSession,
  ) {}

  async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    const rows = await this.objxSession.execute(
      PasswordResetTokenModel
        .insert({
          id: generateSnowflakeId(),
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
        })
        .returning(({ id, userId, tokenHash, expiresAt, createdAt }) => [
          id,
          userId,
          tokenHash,
          expiresAt,
          createdAt,
        ]),
    );
    const row = rows[0];

    if (!row) {
      throw new Error('Password reset token insert did not return a row.');
    }

    return this.mapRow(row);
  }

  async findValidByTokenHash(tokenHash: string, now: Date): Promise<PasswordResetToken | null> {
    const rows = await this.objxSession.execute(
      PasswordResetTokenModel
        .query()
        .where(({ tokenHash: storedTokenHash, expiresAt }, op) =>
          op.and(
            op.eq(storedTokenHash, tokenHash),
            op.gt(expiresAt, now),
          ),
        )
        .orderBy(({ createdAt }) => createdAt, 'desc')
        .limit(1),
    );
    const row = rows[0];

    return row ? this.mapRow(row) : null;
  }

  async deleteByUserId(userId: string): Promise<number> {
    return this.objxSession.execute(
      PasswordResetTokenModel
        .delete()
        .where(({ userId: tokenUserId }, op) => op.eq(tokenUserId, userId)),
    );
  }

  private mapRow(row: PasswordResetTokenRecord): PasswordResetToken {
    return new PasswordResetToken({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    });
  }
}
