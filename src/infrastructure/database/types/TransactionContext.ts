import { Knex } from "knex";

export type TransactionContext = {
  transaction: Knex.Transaction;
};
