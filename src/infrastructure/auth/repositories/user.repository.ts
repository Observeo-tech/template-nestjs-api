import { Injectable } from '@nestjs/common';
import { User } from '@/domain/auth/entities/user.entity';
import { IUserRepository } from '@/domain/auth/repositories/user.repository.interface';
import { BaseRepository } from '@/infrastructure/database/base-repository';

/**
 * User Repository Implementation
 *
 * Implements IUserRepository using Knex and PostgreSQL
 */
@Injectable()
export class UserRepository extends BaseRepository implements IUserRepository {
  private readonly tableName = 'users';

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db
      .table(this.tableName)
      .where({ email })
      .first();

    if (!user) {
      return null;
    }

    return new User(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.db
      .table(this.tableName)
      .where({ id })
      .first();

    if (!user) {
      return null;
    }

    return new User(user);
  }

  /**
   * Create a new user
   */
  async create(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    const [user] = await this.db
      .table(this.tableName)
      .insert({
        ...userData,
        created_at: this.fn.now(),
        updated_at: this.fn.now(),
      })
      .returning('*');

    return new User({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  }
}
