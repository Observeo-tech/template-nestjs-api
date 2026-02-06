import { Module } from '@nestjs/common';
import { AuthDomainModule } from '@/domain/auth/auth-domain.module';
import { AuthInfrastructureModule } from '@/infrastructure/auth/auth-infrastructure.module';
import { AuthController } from './controllers/auth.controller';

/**
 * Auth Application Module
 *
 * Main authentication module that integrates:
 * - Controllers (HTTP layer)
 * - Use Cases (Business logic)
 * - Repositories (Data access)
 *
 * Follows Clean Architecture dependency rule:
 * Application -> Domain <- Infrastructure
 */
@Module({
  imports: [
    AuthDomainModule,
    AuthInfrastructureModule,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
