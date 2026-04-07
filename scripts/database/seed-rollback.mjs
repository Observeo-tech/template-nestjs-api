import { createDatabaseUrl, runCodegenCli, seedsDirectory } from './shared-config.mjs';

runCodegenCli([
  'seed',
  '--dialect', 'postgres',
  '--database', createDatabaseUrl(),
  '--dir', seedsDirectory,
  '--direction', 'revert',
]);
