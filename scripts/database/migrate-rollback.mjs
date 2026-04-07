import { createDatabaseUrl, migrationsDirectory, runCodegenCli } from './shared-config.mjs';

runCodegenCli([
  'migrate',
  '--dialect', 'postgres',
  '--database', createDatabaseUrl(),
  '--dir', migrationsDirectory,
  '--direction', 'down',
]);
