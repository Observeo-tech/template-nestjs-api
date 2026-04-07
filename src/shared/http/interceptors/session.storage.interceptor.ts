import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { SessionStorageService } from '@/shared/session-storage/session-storage.service';
import { getSessionFromContext } from '@/shared/context/execution-context-session.util';
import { OBJX_EXECUTION_CONTEXT_MANAGER } from '@/shared/infrastructure/database/database.tokens';
import type { ObjxExecutionContextManager } from '@/shared/infrastructure/database/database.types';
import { buildObjxExecutionContextValues } from '@/shared/infrastructure/database/objx-execution-context.util';
import { Observable } from 'rxjs';

@Injectable()
export class SessionStorageInterceptor implements NestInterceptor {
  constructor(
    private readonly _sessionStorageService: SessionStorageService,
    @Inject(OBJX_EXECUTION_CONTEXT_MANAGER)
    private readonly objxExecutionContextManager: ObjxExecutionContextManager,
  ) { }

  // eslint-disable-next-line @typescript-eslint/require-await
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const session = getSessionFromContext(context);

    return new Observable((subscriber) => {
      const subscribeWithContext = () => {
        this.objxExecutionContextManager.run(
          {
            values: buildObjxExecutionContextValues(session),
          },
          () => {
            next.handle().subscribe({
              next: (value) => subscriber.next(value),
              error: (err) => subscriber.error(err),
              complete: () => subscriber.complete(),
            });
          },
        );
      };

      if (!session) {
        subscribeWithContext();
        return;
      }

      this._sessionStorageService.storage.run(session, subscribeWithContext);
    });
  }
}
