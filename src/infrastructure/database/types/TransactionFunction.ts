import { Knex } from "knex";

export type TransactionFunction<T> = (trx?: Knex.Transaction) => Promise<T>;
