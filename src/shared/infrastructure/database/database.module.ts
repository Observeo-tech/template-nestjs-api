import { Global, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import knex, { Knex } from 'knex';
import { Model } from 'objection';
import { SessionStorageModule } from '@/shared/session-storage/session-storage.module';
import { knexConfig } from './config/database.config';
import { DatabaseRlsContextService } from './database-rls-context.service';
import { KNEX_CONNECTION } from './database.constants';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly connection: Knex;

  constructor() {
    this.connection = knex(knexConfig);
    Model.knex(this.connection);
  }

  async onApplicationShutdown() {
    await this.connection.destroy();
  }
}

@Global()
@Module({
  imports: [SessionStorageModule],
  providers: [
    DatabaseService,
    DatabaseRlsContextService,
    {
      provide: KNEX_CONNECTION,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) => databaseService.connection,
    },
  ],
  exports: [DatabaseService, DatabaseRlsContextService, KNEX_CONNECTION],
})
export class DatabaseModule {}
