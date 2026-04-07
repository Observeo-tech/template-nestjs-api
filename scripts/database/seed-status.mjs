import {
  listAppliedSchemaNames,
  loadSchemaEntries,
  seedsDirectory,
} from './shared-config.mjs';

const historyNames = new Set(
  await listAppliedSchemaNames('objx_seed_history'),
);
const schemas = await loadSchemaEntries(seedsDirectory, 'seed');
const completed = schemas.filter((schema) => historyNames.has(schema.name));
const pending = schemas.filter((schema) => !historyNames.has(schema.name));

console.log('Completed seeds:');
if (completed.length === 0) {
  console.log('- none');
} else {
  completed.forEach((schema) => {
    console.log(`- ${schema.name} (${schema.fileName})`);
  });
}

console.log('');
console.log('Pending seeds:');
if (pending.length === 0) {
  console.log('- none');
} else {
  pending.forEach((schema) => {
    console.log(`- ${schema.name} (${schema.fileName})`);
  });
}
