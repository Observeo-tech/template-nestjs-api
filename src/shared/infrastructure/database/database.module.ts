import { Global, Injectable, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { createExecutionContextManager } from '@qbobjx/core';
import { createPostgresSession } from '@qbobjx/postgres-driver';
import { Pool, type PoolConfig } from 'pg';
import { envConfig } from '@/config/env.config';
import { OBJX_EXECUTION_CONTEXT_MANAGER, OBJX_SESSION, PG_POOL } from './database.tokens';
import type { ObjxSession } from './database.types';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly pool: Pool;
  readonly executionContextManager = createExecutionContextManager();
  readonly objxSession: ObjxSession;

  constructor() {
    this.pool = new Pool(createPgPoolConfig());
    this.objxSession = createPostgresSession({
      pool: this.pool,
      executionContextManager: this.executionContextManager,
      hydrateByDefault: true,
      executionContextSettings: {
        bindings: [
          {
            setting: 'app.current_user_id',
            value: ({ executionContext }) =>
              String(executionContext.values.get('userId') ?? ''),
          },
          {
            setting: 'app.current_organization_id',
            value: ({ executionContext }) =>
              String(executionContext.values.get('currentOrganizationId') ?? ''),
          },
          {
            setting: 'app.current_organization_role',
            value: ({ executionContext }) =>
              String(executionContext.values.get('currentOrganizationRole') ?? ''),
          },
        ],
      },
      observers:
        envConfig.isProduction
          ? undefined
          : [
            {
              onQueryStart: (event) => Logger.debug(`Running query: ${event.compiledQuery.sql}`)
            }
          ]
    });
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: PG_POOL,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) => databaseService.pool,
    },
    {
      provide: OBJX_EXECUTION_CONTEXT_MANAGER,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) =>
        databaseService.executionContextManager,
    },
    {
      provide: OBJX_SESSION,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) => databaseService.objxSession,
    },
  ],
  exports: [
    DatabaseService,
    PG_POOL,
    OBJX_EXECUTION_CONTEXT_MANAGER,
    OBJX_SESSION,
  ],
})
export class DatabaseModule { }

function createPgPoolConfig(): PoolConfig {
  const defaultDatabaseName = process.env.APP_SLUG || 'api';

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || defaultDatabaseName,
    user: process.env.DB_USER || defaultDatabaseName,
    password: process.env.DB_PASSWORD || 'api123',
    ssl: envConfig.isProduction && process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
    min: 2,
    max: 10,
  };
}
