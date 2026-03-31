import { envConfig } from '@/config/env.config';
import { Knex } from 'knex';
import { objectToCamel, toSnake } from 'ts-case-convert';

const defaultDatabaseName = process.env.APP_SLUG || 'api';

function postProcessResponse(result: unknown) {
  if (result === null || typeof result !== 'object') {
    return result;
  }

  return objectToCamel(result as object);
}

export const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || defaultDatabaseName,
    user: process.env.DB_USER || defaultDatabaseName,
    password: process.env.DB_PASSWORD || 'api123',
    ssl: envConfig.isProduction && process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  postProcessResponse,
  wrapIdentifier: (value, origImpl) => origImpl(toSnake(value)),
};
