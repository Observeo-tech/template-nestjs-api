import { Inject, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './constants/database.constants';

import { SessionStorageService } from '../../domain/common/session-storage/session-storage.service';
import { TransactionStorageService } from './transaction-storage.service';
import { TransactionContext } from './types/TransactionContext';
import { TransactionFunction } from './types/TransactionFunction';

export abstract class BaseRepository {
  private readonly _logger = new Logger(BaseRepository.name);
  private _storage = new AsyncLocalStorage<TransactionContext>();

  private transaction: Knex.Transaction | undefined = undefined;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly _knex: Knex,
    @Inject(TransactionStorageService) private readonly _transactionStorageService: TransactionStorageService,
    @Inject(SessionStorageService) private readonly _sessionStorageService: SessionStorageService,
  ) {
    this._storage = this._transactionStorageService.storage;
  }

  /**
   * Retorna o cliente de banco de dados apropriado
   * Se houver uma transação ativa no contexto (via TransactionService),
   * retorna a transação. Caso contrário, retorna a conexão normal.
   */
  get db() {
    const contextTransaction = this._storage.getStore()?.transaction;
    if (contextTransaction) {
      return contextTransaction;
    }

    if (this.transaction) {
      return this.transaction;
    }

    return this._knex.withSchema('');
  }

  get raw(): Knex.RawBuilder {
    return this._knex.raw;
  }

  get fn(): Knex.FunctionHelper {
    return this._knex.fn;
  }

  async runInTransaction<T>(callback: TransactionFunction<T>): Promise<T> {
    const existingContext = this._storage.getStore();
    if (existingContext) {
      this._logger.debug(`Reusing existing transaction`);
      return await callback();
    }

    return await this._knex.transaction(async (trx) => {
      const context: TransactionContext = {
        transaction: trx,
      };

      return await this._storage.run(context, async () => {
        try {
          const result = await callback();
          this._logger.debug(`Transaction completed successfully`);
          return result;
        } catch (error) {
          this._logger.error(`Transaction failed`, error.stack);
          throw error;
        }
      });
    });
  }
}
