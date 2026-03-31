import { Injectable } from '@nestjs/common';
import { User } from '@/modules/users/domain/entities/user.entity';
import {
  CreateUserData,
  FindAllUsersFilters,
  FindAllUsersResult,
  IUserRepository,
  UpdateUserData,
} from '@/modules/users/domain/repositories/user.repository.interface';
import { UserModel } from '../models/user.model';

@Injectable()
export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.query().findOne({ email });

    return user ? user.toDomain() : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await UserModel.query().findOne({ googleId });

    return user ? user.toDomain() : null;
  }

  async findById(
    id: string,
    organizationId?: string,
  ): Promise<User | null> {
    const query = UserModel.query()
      .alias('u')
      .select('u.*')
      .where('u.id', id);

    if (organizationId) {
      query
        .join('organization_memberships as om', 'om.user_id', 'u.id')
        .where('om.organization_id', organizationId);
    }

    const user = await query.first();

    return user ? user.toDomain() : null;
  }

  async findAll(filters: FindAllUsersFilters): Promise<FindAllUsersResult> {
    const query = UserModel.query().alias('u');
    const shouldPaginate = filters.paginate ?? true;
    const pageCount = filters.pageCount ?? 1;
    const recordsPerPage = filters.recordsPerPage ?? 25;

    if (filters.organizationId) {
      query
        .join('organization_memberships as om', 'om.user_id', 'u.id')
        .where('om.organization_id', filters.organizationId);
    }

    if (filters.id) {
      query.where('u.id', filters.id);
    }

    if (filters.email) {
      query.where('u.email', filters.email);
    }

    if (filters.name) {
      query.where('u.name', filters.name);
    }

    const total = await query.clone().resultSize();

    const usersQuery = query
      .clone()
      .select('u.*')
      .orderBy('u.createdAt', 'desc');

    if (shouldPaginate) {
      usersQuery
        .offset((pageCount - 1) * recordsPerPage)
        .limit(recordsPerPage);
    }

    const users = await usersQuery;

    return {
      data: users.map(user => user.toDomain()),
      total,
    };
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await UserModel.query().insertAndFetch({
      email: data.email,
      password: data.password,
      googleId: data.googleId,
      avatarUrl: data.avatarUrl,
      name: data.name,
    });

    return user.toDomain();
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const updatePayload: Record<string, unknown> = {};

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

    const knex = UserModel.knex();

    if (!knex) {
      throw new Error('Objection is not bound to a Knex connection.');
    }

    const user = await UserModel.query().patchAndFetchById(id, {
      ...updatePayload,
      updatedAt: knex.fn.now(),
    });

    return user ? user.toDomain() : null;
  }

  async delete(id: string): Promise<boolean> {
    const deletedRows = await UserModel.query()
      .where({ id })
      .delete();

    return deletedRows > 0;
  }
}
