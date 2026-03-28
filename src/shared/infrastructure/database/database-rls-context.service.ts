import { Injectable } from '@nestjs/common';
import type { Knex } from 'knex';
import { SessionStorageService } from '@/shared/session-storage/session-storage.service';
import type { AppSessionContext } from '@/shared/context/app-session-context';

@Injectable()
export class DatabaseRlsContextService {
  constructor(
    private readonly sessionStorageService: SessionStorageService,
  ) {}

  getSessionContext(): AppSessionContext {
    return this.sessionStorageService.getStorageData() ?? {};
  }

  getCurrentUserId(): string | undefined {
    return this.getSessionContext().userId;
  }

  getCurrentOrganizationId(): string | undefined {
    return this.getSessionContext().currentOrganizationId;
  }

  getCurrentOrganizationRole(): string | undefined {
    return this.getSessionContext().currentOrganizationRole;
  }

  async applyToTransaction(trx: Knex.Transaction): Promise<void> {
    const session = this.getSessionContext();

    await trx.raw(
      `select
        set_config('app.current_user_id', ?, true),
        set_config('app.current_organization_id', ?, true),
        set_config('app.current_organization_role', ?, true)`,
      [
        session.userId ?? '',
        session.currentOrganizationId ?? '',
        session.currentOrganizationRole ?? '',
      ],
    );
  }
}
