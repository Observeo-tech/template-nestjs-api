import { Inject, Injectable } from '@nestjs/common';
import { expr } from '@qbobjx/core';
import { User } from '@/modules/users/domain/entities/user.entity';
import {
  CreateUserData,
  FindAllUsersFilters,
  FindAllUsersResult,
  IUserRepository,
  UpdateUserData,
} from '@/modules/users/domain/repositories/user.repository.interface';
import { generateSnowflakeId } from '@/shared/ids/snowflake-id.util';
import { OBJX_SESSION } from '@/shared/infrastructure/database/database.tokens';
import type { ObjxSession } from '@/shared/infrastructure/database/database.types';
import {
  OrganizationMembershipModel,
  type OrganizationMembershipRecord,
} from '@/modules/organizations/infrastructure/persistence/models/organization-membership.model';
import { UserModel, type UserRecord } from '../models/user.model';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @Inject(OBJX_SESSION)
    private readonly objxSession: ObjxSession,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.objxSession.execute(
      UserModel
        .query()
        .where(({ email: userEmail }, op) => op.eq(userEmail, email))
        .limit(1),
    );
    const row = rows[0];

    return row ? mapUserRow(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const rows = await this.objxSession.execute(
      UserModel
        .query()
        .where(({ googleId: userGoogleId }, op) => op.eq(userGoogleId, googleId))
        .limit(1),
    );
    const row = rows[0];

    return row ? mapUserRow(row) : null;
  }

  async findById(
    id: string,
    organizationId?: string,
  ): Promise<User | null> {
    if (organizationId) {
      const membership = await this.findMembershipForUserInOrganization(
        id,
        organizationId,
      );

      if (!membership) {
        return null;
      }
    }

    const rows = await this.objxSession.execute(
      UserModel
        .query()
        .where(({ id: userId }, op) => op.eq(userId, id))
        .limit(1),
    );
    const row = rows[0];

    return row ? mapUserRow(row) : null;
  }

  async findAll(filters: FindAllUsersFilters): Promise<FindAllUsersResult> {
    const shouldPaginate = filters.paginate ?? true;
    const pageCount = filters.pageCount ?? 1;
    const recordsPerPage = filters.recordsPerPage ?? 25;
    const organizationUserIds = filters.organizationId
      ? await this.findOrganizationUserIds(filters.organizationId)
      : null;

    if (organizationUserIds && organizationUserIds.length === 0) {
      return {
        data: [],
        total: 0,
      };
    }

    let countQuery = UserModel.query();
    let usersQuery = UserModel.query()
      .orderBy(({ createdAt }) => createdAt, 'desc');

    if (organizationUserIds) {
      countQuery = countQuery.where(({ id }, op) => op.in(id, organizationUserIds));
      usersQuery = usersQuery.where(({ id }, op) => op.in(id, organizationUserIds));
    }

    if (filters.id) {
      countQuery = countQuery.where(({ id }, op) => op.eq(id, filters.id!));
      usersQuery = usersQuery.where(({ id }, op) => op.eq(id, filters.id!));
    }

    if (filters.email) {
      countQuery = countQuery.where(({ email }, op) => op.eq(email, filters.email!));
      usersQuery = usersQuery.where(({ email }, op) => op.eq(email, filters.email!));
    }

    if (filters.name) {
      countQuery = countQuery.where(({ name }, op) => op.eq(name, filters.name!));
      usersQuery = usersQuery.where(({ name }, op) => op.eq(name, filters.name!));
    }

    if (shouldPaginate) {
      usersQuery = usersQuery
        .offset((pageCount - 1) * recordsPerPage)
        .limit(recordsPerPage);
    }

    const [countRows, users] = await Promise.all([
      this.objxSession.execute(
        countQuery.selectExpr('total', ({ id }) => expr.count<number>(id)),
      ),
      this.objxSession.execute(usersQuery),
    ]);
    const total = Number(countRows[0]?.total ?? 0);

    return {
      data: users.map((row) => mapUserRow(row)),
      total,
    };
  }

  async create(data: CreateUserData): Promise<User> {
    const rows = await this.objxSession.execute(
      UserModel
        .insert({
          id: generateSnowflakeId(),
          email: data.email,
          password: data.password ?? null,
          googleId: data.googleId ?? null,
          avatarUrl: data.avatarUrl ?? null,
          name: data.name,
        })
        .returning(({ id, email, password, googleId, avatarUrl, name, createdAt, updatedAt }) => [
          id,
          email,
          password,
          googleId,
          avatarUrl,
          name,
          createdAt,
          updatedAt,
        ]),
    );
    const row = rows[0];

    if (!row) {
      throw new Error('User insert did not return a row.');
    }

    return mapUserRow(row);
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const updatePayload: Partial<UserRecord> = {};

    if (data.email !== undefined) {
      updatePayload.email = data.email;
    }

    if (data.password !== undefined) {
      updatePayload.password = data.password;
    }

    if (data.googleId !== undefined) {
      updatePayload.googleId = data.googleId;
    }

    if (data.avatarUrl !== undefined) {
      updatePayload.avatarUrl = data.avatarUrl;
    }

    if (data.name !== undefined) {
      updatePayload.name = data.name;
    }

    if (Object.keys(updatePayload).length === 0) {
      return this.findById(id);
    }

    updatePayload.updatedAt = new Date();

    const rows = await this.objxSession.execute(
      UserModel
        .update(updatePayload)
        .where(({ id: userId }, op) => op.eq(userId, id))
        .returning(({ id, email, password, googleId, avatarUrl, name, createdAt, updatedAt }) => [
          id,
          email,
          password,
          googleId,
          avatarUrl,
          name,
          createdAt,
          updatedAt,
        ]),
    );
    const row = rows[0];

    return row ? mapUserRow(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deletedRows = await this.objxSession.execute(
      UserModel
        .delete()
        .where(({ id: userId }, op) => op.eq(userId, id)),
    );

    return deletedRows > 0;
  }

  private async findMembershipForUserInOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembershipRecord | null> {
    const rows = await this.objxSession.execute(
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

  private async findOrganizationUserIds(
    organizationId: string,
  ): Promise<string[]> {
    const memberships = await this.objxSession.execute(
      OrganizationMembershipModel
        .query()
        .where(({ organizationId: membershipOrganizationId }, op) =>
          op.eq(membershipOrganizationId, organizationId),
        ),
    );

    return Array.from(new Set(memberships.map((membership) => membership.userId)));
  }
}

function mapUserRow(row: UserRecord): User {
  return new User({
    id: row.id,
    email: row.email,
    password: row.password,
    googleId: row.googleId,
    avatarUrl: row.avatarUrl,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
