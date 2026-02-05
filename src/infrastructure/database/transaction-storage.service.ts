import { AsyncLocalStorage } from "async_hooks";
import { TransactionContext } from "./types/TransactionContext";

export class TransactionStorageService {
  private _storage = new AsyncLocalStorage<TransactionContext>();
  constructor() {}

  get storage(): AsyncLocalStorage<TransactionContext> {
    return this._storage;
  }
}
