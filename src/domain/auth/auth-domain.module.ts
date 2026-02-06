import { Module } from '@nestjs/common';
import { LoginUseCase } from './use-cases';

/**
 * Auth Domain Module
 *
 * Contains business logic (use cases) for authentication
 * This layer is framework-agnostic and contains pure business rules
 */
@Module({
  providers: [LoginUseCase],
  exports: [LoginUseCase],
})
export class AuthDomainModule {}
