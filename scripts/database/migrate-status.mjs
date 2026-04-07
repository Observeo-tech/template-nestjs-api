import {
  listAppliedSchemaNames,
  loadSchemaEntries,
  migrationsDirectory,
} from './shared-config.mjs';

const historyNames = new Set(
  await listAppliedSchemaNames('objx_migration_history'),
);
const schemas = await loadSchemaEntries(migrationsDirectory, 'migration');
const completed = schemas.filter((schema) => historyNames.has(schema.name));
const pending = schemas.filter((schema) => !historyNames.has(schema.name));

console.log('Completed migrations:');
if (completed.length === 0) {
  console.log('- none');
} else {
  completed.forEach((schema) => {
    console.log(`- ${schema.name} (${schema.fileName})`);
  });
}

console.log('');
console.log('Pending migrations:');
if (pending.length === 0) {
  console.log('- none');
} else {
  pending.forEach((schema) => {
    console.log(`- ${schema.name} (${schema.fileName})`);
  });
}
