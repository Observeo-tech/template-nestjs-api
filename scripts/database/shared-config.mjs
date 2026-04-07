import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const supportedSchemaModuleExtensions = new Set(['.js', '.mjs', '.cjs']);

export const migrationsDirectory = path.resolve(
  currentDirectory,
  '../../src/shared/infrastructure/database/migrations',
);

export const seedsDirectory = path.resolve(
  currentDirectory,
  '../../src/shared/infrastructure/database/seeds',
);

export function createPgPoolConfig() {
  const defaultDatabaseName = process.env.APP_SLUG || 'api';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || defaultDatabaseName,
    user: process.env.DB_USER || defaultDatabaseName,
    password: process.env.DB_PASSWORD || 'api123',
    ssl: isProduction && process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  };
}

export function createDatabaseUrl() {
  const config = createPgPoolConfig();
  const username = encodeURIComponent(config.user);
  const password = encodeURIComponent(config.password);
  const host = config.host;
  const port = config.port;
  const database = encodeURIComponent(config.database);
  const sslSuffix = config.ssl ? '?sslmode=require' : '';

  return `postgresql://${username}:${password}@${host}:${port}/${database}${sslSuffix}`;
}

export function runCodegenCli(args) {
  const cliPath = path.resolve(
    currentDirectory,
    '../../node_modules/@qbobjx/codegen/dist/cli.js',
  );
  const result = spawnSync(
    process.execPath,
    [cliPath, ...args],
    {
      cwd: path.resolve(currentDirectory, '../..'),
      stdio: 'inherit',
      env: process.env,
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export async function loadSchemaEntries(directoryPath, preferredExportName) {
  const directoryEntries = await fs.readdir(directoryPath, {
    withFileTypes: true,
  });
  const files = directoryEntries
    .filter((entry) => {
      if (!entry.isFile()) {
        return false;
      }

      return supportedSchemaModuleExtensions.has(
        path.extname(entry.name).toLowerCase(),
      );
    })
    .map((entry) => ({
      fileName: entry.name,
      filePath: path.join(directoryPath, entry.name),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));

  const entries = [];

  for (const file of files) {
    const moduleUrl = pathToFileURL(file.filePath);
    moduleUrl.searchParams.set('cacheBust', `${Date.now()}_${Math.random()}`);
    const moduleExports = await import(moduleUrl.href);
    const schema =
      moduleExports.default ??
      moduleExports[preferredExportName] ??
      moduleExports.schema;

    if (!schema?.name) {
      throw new Error(
        `Schema file "${file.fileName}" does not export a schema with a "name".`,
      );
    }

    entries.push({
      fileName: file.fileName,
      name: schema.name,
    });
  }

  return entries;
}

export async function listAppliedSchemaNames(historyTableName) {
  const pool = new Pool(createPgPoolConfig());

  try {
    const result = await pool.query(
      `select name from ${historyTableName} order by name asc`,
    );

    return result.rows
      .map((row) => row.name)
      .filter((name) => typeof name === 'string');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
      return [];
    }

    throw error;
  } finally {
    await pool.end();
  }
}
