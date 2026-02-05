import { Module } from '@nestjs/common';
import { ApplicationModule } from './application/application.module';
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [
    InfrastructureModule,
    DomainModule,
    ApplicationModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
