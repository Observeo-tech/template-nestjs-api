import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from '@/domain/auth/repositories/user.repository.interface';
import { User } from '@/domain/auth/entities/user.entity';
import { UserRepository } from './repositories/user.repository';

/**
 * Auth Infrastructure Module
 *
 * Contains infrastructure implementations:
 * - Database repositories
 * - External services
 * - Third-party integrations
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class AuthInfrastructureModule {}
