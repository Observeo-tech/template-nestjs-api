import fs from 'node:fs';
import path from 'node:path';
import { migrationsDirectory } from './shared-config.mjs';

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const rawName = process.argv[2] || process.env.npm_config_name;

if (!rawName) {
  fail('Provide a migration name. Example: npm run migrate:make -- create_users_table');
}

const normalizedName = rawName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

if (!normalizedName) {
  fail('Migration name could not be normalized.');
}

const timestamp = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, '')
  .slice(0, 14);

const schemaName = `${timestamp}_${normalizedName}`;
const fileName = `${schemaName}.migration.mjs`;
const filePath = path.join(migrationsDirectory, fileName);

if (fs.existsSync(filePath)) {
  fail(`Migration "${fileName}" already exists.`);
}

const template = `import { defineMigration } from '@qbobjx/codegen';

export default defineMigration({
  name: '${schemaName}',
  description: '${normalizedName.replace(/_/g, ' ')}',
  up: [
  ],
  down: [
  ],
});
`;

fs.mkdirSync(migrationsDirectory, { recursive: true });
fs.writeFileSync(filePath, template, 'utf8');

console.log(`Created migration: ${fileName}`);
