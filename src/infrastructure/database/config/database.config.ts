import { Knex } from 'knex';
import { objectToCamel, toSnake } from 'ts-case-convert';

export const databaseConfig: Knex.Config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'api',
    user: process.env.DB_USER || 'api',
    password: process.env.DB_PASSWORD || 'api123',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/infrastructure/database/migrations',
    extension: 'ts',
  },
  postProcessResponse: objectToCamel,
  wrapIdentifier: (value: string, origImpl: (value: string) => string) => {
    return origImpl(toSnake(value));
  },
};
