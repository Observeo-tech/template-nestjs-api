import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '@/modules/auth/auth.module';
import { EmailsModule } from '@/modules/emails/emails.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { PermissionsContextInterceptor } from '@/modules/permissions/application/interceptors/permissions-context.interceptor';
import { PermissionsModule } from '@/modules/permissions/permissions.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { UsersModule } from '@/modules/users/users.module';
import { WsModule } from '@/modules/ws/ws.module';
import { AuthGuard } from '@/shared/http/guards/auth.guard';
import { HttpCacheInterceptor, SessionStorageInterceptor } from '@/shared/http/interceptors';
import { SharedInfrastructureModule } from '@/shared/infrastructure/shared-infrastructure.module';

@Module({
  imports: [
    SharedInfrastructureModule,
    AuthModule,
    EmailsModule,
    OrganizationsModule,
    PermissionsModule,
    ReportsModule,
    UsersModule,
    WsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SessionStorageInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PermissionsContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
  exports: [],
})
export class AppModule { }
