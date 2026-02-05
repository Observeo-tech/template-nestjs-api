import { Global, Module } from '@nestjs/common';
import { Knex, knex } from 'knex';
import { databaseConfig } from './config/database.config';
import { KNEX_CONNECTION } from './constants/database.constants';
import { TransactionStorageService } from './transaction-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: KNEX_CONNECTION,
      useFactory: async (): Promise<Knex> => {
        const knexInstance = knex(databaseConfig);
        return knexInstance;
      },
    },
    TransactionStorageService
  ],
  exports: [
    KNEX_CONNECTION,
    TransactionStorageService
  ],
})
export class DatabaseModule {}
