# Database Schemas

This folder contains typed OBJX migration and seed schemas.

## Conventions

- migrations: `migrations/*.migration.mjs`
- seeds: `seeds/*.seed.mjs`

## Exports Used

- `defineMigration`
- `defineSeed`
- `runMigrationSchema`
- `runSeedSchema`

## CLI

- apply migrations: `npm run codegen -- migrate --dialect postgres --database postgresql://postgres:postgres@127.0.0.1:5432/objx_app --dir ./db/migrations --direction up`
- revert migrations: `npm run codegen -- migrate --dialect postgres --database postgresql://postgres:postgres@127.0.0.1:5432/objx_app --dir ./db/migrations --direction down`
- run seeds: `npm run codegen -- seed --dialect postgres --database postgresql://postgres:postgres@127.0.0.1:5432/objx_app --dir ./db/seeds --direction run`
- revert seeds: `npm run codegen -- seed --dialect postgres --database postgresql://postgres:postgres@127.0.0.1:5432/objx_app --dir ./db/seeds --direction revert`
