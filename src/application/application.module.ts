import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './http/auth/auth.module';
import { AuthGuard } from './http/common/guards/auth.guard';
import { HttpCacheInterceptor, SessionStorageInterceptor } from './http/common/interceptors';

@Module({
  imports: [AuthModule],
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
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class ApplicationModule {}
