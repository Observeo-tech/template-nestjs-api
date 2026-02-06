import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '@/domain/auth/repositories/user.repository.interface';
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
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class AuthInfrastructureModule {}
