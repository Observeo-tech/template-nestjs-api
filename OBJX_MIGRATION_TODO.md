# Objx Migration Todo

Last updated: 2026-04-07
Status: scaffolding and docs cleanup in progress

This file is the source of truth for the full replacement of `knex` + `objection` with `Objx`.
Update this file on every implementation session:

- mark completed items with `[x]`
- mark active work with `[~]`
- keep pending work as `[ ]`
- append a short entry to the session log

## Goal

Replace the current database stack completely:

- remove all runtime use of `knex`
- remove all runtime use of `objection`
- replace model/query/repository/database bootstrap with Objx
- replace migration/seed/tooling/scaffolding with Objx-native tooling
- update docs so the template no longer reintroduces Knex/Objection

## Scope Rules

- This is a template/base project, not a legacy production app.
- No compatibility layer is required.
- No coexistence period is required.
- The migration is a full cutover in one branch.

## Architectural Decisions

### Fixed decisions

- Use Objx `0.3.0` or newer.
- Use `pg.Pool` + Objx Postgres session as the only database runtime.
- Keep request/session state for the application in the current request/session layer.
- Propagate request values into Objx execution context for database work.
- Use Objx `executionContextSettings` to bind PostgreSQL `set_config(...)` values.
- Treat PostgreSQL RLS and Objx tenant plugin as different concerns.
- Use `createSnakeCaseNamingPlugin()` on each model definition.
- Use Objx hydration for timestamp -> `Date`.
- Keep explicit snowflake ID generation in app code.
- Prefer Objx builders end-to-end; do not leave raw SQL in repositories unless there is no viable builder path.

### Important constraint from Objx `0.3.0`

Objx now supports binding PostgreSQL session variables from execution context through:

- `createPostgresSession({ executionContextManager, executionContextSettings })`

Per Objx README, `executionContextSettings` runs `set_config(...)` at the start of
`session.transaction(...)`.

Implication:

- any query path that depends on PostgreSQL RLS via `current_setting(...)` must run inside `session.transaction(...)`
- this includes protected reads, not only writes

Do not assume `session.execute(...)` outside a transaction will have the required PostgreSQL context.

## Current State Snapshot

### Current runtime database stack

- `src/shared/infrastructure/database/database.module.ts`
- `src/shared/infrastructure/database/database.constants.ts`
- `src/shared/infrastructure/database/database-rls-context.service.ts`
- `src/shared/infrastructure/database/config/database.config.ts`
- `src/shared/infrastructure/database/models/snowflake.model.ts`

### Current persistence files tied to Knex/Objection

- `src/modules/auth/infrastructure/persistence/models/password-reset-token.model.ts`
- `src/modules/auth/infrastructure/persistence/repositories/password-reset-token.repository.ts`
- `src/modules/users/infrastructure/persistence/models/user.model.ts`
- `src/modules/users/infrastructure/persistence/repositories/user.repository.ts`
- `src/modules/organizations/infrastructure/persistence/models/organization.model.ts`
- `src/modules/organizations/infrastructure/persistence/models/organization-membership.model.ts`
- `src/modules/organizations/infrastructure/persistence/repositories/organization.repository.ts`
- `src/modules/reports/infrastructure/persistence/repositories/organization-report-settings.repository.ts`
- `src/modules/permissions/infrastructure/persistence/repositories/permissions.repository.ts`

### Current migration/seed/tooling tied to Knex

- `scripts/database/make-migration.mjs`
- `scripts/database/make-seed.mjs`
- `scripts/database/migrate-latest.mjs`
- `scripts/database/migrate-rollback.mjs`
- `scripts/database/migrate-status.mjs`
- `scripts/database/seed-run.mjs`
- `scripts/database/seed-rollback.mjs`
- `scripts/database/seed-status.mjs`
- `scripts/database/shared-config.mjs`
- `scripts/database/shared-seed-runner.mjs`
- `scripts/new-module.mjs`
- `src/shared/infrastructure/database/migrations/*.mjs`
- `src/shared/infrastructure/database/seeds/*.mjs`

### Current request/session context files relevant to the migration

- `src/shared/session-storage/session-storage.module.ts`
- `src/shared/session-storage/session-storage.service.ts`
- `src/shared/context/app-session-context.ts`
- `src/shared/context/execution-context-session.util.ts`
- `src/shared/http/interceptors/session.storage.interceptor.ts`
- `src/shared/http/guards/current-organization.guard.ts`
- `src/modules/auth/presentation/http/controllers/auth.controller.ts`
- `src/modules/organizations/presentation/http/controllers/organizations.controller.ts`
- `src/modules/permissions/application/services/permissions-ability.factory.ts`

### Current duplicate context code to clean up

- `src/shared/context/session-context.module.ts`
- `src/shared/context/session-context.service.ts`

These files appear unused and should be deleted once confirmed during implementation.

## Target Architecture

### Database bootstrap

Target outcome:

- `DatabaseModule` exposes a single Objx Postgres session provider
- `DatabaseModule` exposes the Objx execution context manager if needed by interceptors/services
- no `KNEX_CONNECTION`
- no `Model.knex(...)`
- no Objection base model

Suggested provider shape:

- `PG_POOL`
- `OBJX_EXECUTION_CONTEXT_MANAGER`
- `OBJX_SESSION`

The exact token names can change, but keep them explicit and stable.

### Request context flow

Target outcome:

1. HTTP/WS request/session data remains available as app session state.
2. The interceptor reads the app session and opens an Objx execution context for the request.
3. Repository methods that depend on RLS use `session.transaction(...)`.
4. `executionContextSettings` pushes:
   - `app.current_user_id`
   - `app.current_organization_id`
   - `app.current_organization_role`

### Models

Target outcome:

- all persistence models are Objx `defineModel(...)`
- each model uses snake_case naming plugin
- timestamps are hydrated as `Date`
- snowflake IDs are generated explicitly in the insert path

### Repositories

Target outcome:

- simple repositories use Objx builders where clear
- repositories should stay on Objx builders where viable
- RLS-protected methods use explicit transactions
- no imports from `knex`
- no imports from `objection`

## Execution Order

Follow this order unless a session log entry explicitly changes it.

1. Infrastructure and package changes
2. Request context integration
3. Models
4. Simple repositories
5. Complex repositories
6. Migrations and seeds
7. Module scaffolding
8. Docs
9. Cleanup and verification

## Detailed Checklist

### Phase 0 - Analysis Baseline

- [x] Confirm Objx `0.3.0` feature for PostgreSQL execution-context settings in official README.
- [x] Confirm current Knex/Objection touchpoints in `src`, `scripts`, `README.md`, `QUICK_START.md`, and `package.json`.
- [x] Decide that migration is a full cutover without compatibility mode.

### Phase 1 - Dependencies and Database Infrastructure

- [x] Add Objx runtime dependencies to `package.json`.
- [x] Add Objx tooling dependency to `package.json`.
- [x] Remove `knex` from `package.json`.
- [x] Remove `objection` from `package.json`.
- [x] Remove `ts-case-convert` from `package.json` after database naming conversion is gone.
- [x] Run install and refresh lockfile.

Files:

- `package.json`
- `package-lock.json`

Implementation notes:

- Expect to need at least:
  - `@qbobjx/core`
  - `@qbobjx/sql-engine`
  - `@qbobjx/postgres-driver`
  - `@qbobjx/plugins`
  - `@qbobjx/nestjs`
  - `@qbobjx/codegen` as dev dependency
- Keep `pg`.

Acceptance:

- project dependencies no longer include `knex`, `objection`, `ts-case-convert`
- lockfile updated

### Phase 2 - Replace Database Module

- [x] Rewrite `src/shared/infrastructure/database/database.module.ts` to expose `pg.Pool` + Objx session in parallel with the legacy runtime during the migration branch.
- [x] Introduce provider tokens/constants for Objx session and execution context manager.
- [x] Configure `executionContextSettings.bindings` for PostgreSQL session variables.
- [x] Remove `src/shared/infrastructure/database/database.constants.ts`.
- [x] Remove `src/shared/infrastructure/database/config/database.config.ts`.
- [x] Remove `src/shared/infrastructure/database/database-rls-context.service.ts`.
- [x] Remove `src/shared/infrastructure/database/models/snowflake.model.ts`.
- [x] Verify `src/shared/infrastructure/shared-infrastructure.module.ts` still wires the new database module correctly.

Files:

- `src/shared/infrastructure/database/database.module.ts`
- `src/shared/infrastructure/database/database.constants.ts`
- `src/shared/infrastructure/database/config/database.config.ts`
- `src/shared/infrastructure/database/database-rls-context.service.ts`
- `src/shared/infrastructure/database/models/snowflake.model.ts`
- `src/shared/infrastructure/shared-infrastructure.module.ts`

Implementation notes:

- The current `DatabaseRlsContextService` should not be ported.
- The Objx session should be the only database execution entrypoint.
- Pool shutdown must still happen on app shutdown.

Acceptance:

- no `knex` bootstrap remains
- no `objection` bootstrap remains
- Objx session is injectable

### Phase 3 - Request Context and Execution Context Integration

- [x] Update `src/shared/http/interceptors/session.storage.interceptor.ts` to open Objx execution context from request session data.
- [ ] Keep app session storage available for non-database consumers during the first cut.
- [ ] Decide whether to keep `SessionStorageService` name or rename it later.
- [ ] Ensure updated session fields from guards/controllers continue to be reflected in request-local state.
- [ ] Verify `CurrentOrganizationGuard` continues to update request/session state correctly.
- [ ] Verify `PermissionsAbilityFactory` still resolves current app session correctly.
- [x] Delete unused duplicate context implementation once confirmed:
  - `src/shared/context/session-context.module.ts`
  - `src/shared/context/session-context.service.ts`

Files:

- `src/shared/http/interceptors/session.storage.interceptor.ts`
- `src/shared/session-storage/session-storage.module.ts`
- `src/shared/session-storage/session-storage.service.ts`
- `src/shared/context/app-session-context.ts`
- `src/shared/context/execution-context-session.util.ts`
- `src/shared/http/guards/current-organization.guard.ts`
- `src/modules/auth/presentation/http/controllers/auth.controller.ts`
- `src/modules/organizations/presentation/http/controllers/organizations.controller.ts`
- `src/modules/permissions/application/services/permissions-ability.factory.ts`
- `src/shared/context/session-context.module.ts`
- `src/shared/context/session-context.service.ts`

Implementation notes:

- Do not collapse app session storage and Objx execution context into one abstraction in the first cut.
- App session state is still used by controllers, guards, and permission services.
- The interceptor is the best place to bridge request session -> Objx execution context.

Acceptance:

- request context is available to Objx through execution context
- app session behavior still works for HTTP and WS paths

### Phase 4 - Define Objx Models

- [x] Replace `password-reset-token.model.ts` with Objx model definition.
- [x] Replace `user.model.ts` with Objx model definition.
- [x] Replace `organization.model.ts` with Objx model definition.
- [x] Replace `organization-membership.model.ts` with Objx model definition.
- [x] Add any extra Objx models needed for repository joins:
  - roles
  - permissions
  - permission_features
  - permission_actions
  - role_permissions
  - organization_membership_roles
  - organization_user_permissions
  - organization_report_settings
- [ ] Standardize plugin usage per model:
  - snake_case naming
  - timestamps where applicable
- [ ] Decide where shared Objx model helpers live.

Files:

- `src/modules/auth/infrastructure/persistence/models/password-reset-token.model.ts`
- `src/modules/users/infrastructure/persistence/models/user.model.ts`
- `src/modules/organizations/infrastructure/persistence/models/organization.model.ts`
- `src/modules/organizations/infrastructure/persistence/models/organization-membership.model.ts`
- new model files as needed under module persistence model folders or shared persistence model folder

Implementation notes:

- Do not recreate an Objection-like base class.
- Prefer explicit model definitions and small local helpers.
- Keep snowflake generation explicit in inserts, not hidden in magic runtime behavior.

Acceptance:

- no model imports from `objection`
- all required repository tables have Objx model coverage

### Phase 5 - Rewrite Simple Repositories

- [x] Rewrite `password-reset-token.repository.ts`.
- [x] Rewrite `user.repository.ts`.
- [x] Rewrite `organization.repository.ts`.
- [x] Remove any reliance on `Model.query()`, `resultSize()`, `insertAndFetch()`, `patchAndFetchById()`, and direct Knex access.

Files:

- `src/modules/auth/infrastructure/persistence/repositories/password-reset-token.repository.ts`
- `src/modules/users/infrastructure/persistence/repositories/user.repository.ts`
- `src/modules/organizations/infrastructure/persistence/repositories/organization.repository.ts`

Implementation notes:

- `user.repository.ts` needs replacements for:
  - filtered list
  - pagination + total count
  - optional join with organization membership
  - update with timestamp bump
- `organization.repository.ts` needs:
  - organization create
  - membership create
  - role lookup
  - membership role insert
  - transaction boundary

Acceptance:

- simple repositories no longer import `knex` or `objection`
- repository methods preserve current behavior

### Phase 6 - Rewrite Complex Repositories

- [x] Rewrite `organization-report-settings.repository.ts`.
- [x] Rewrite `permissions.repository.ts`.
- [x] Ensure all RLS-protected methods use `session.transaction(...)`.
- [x] Keep migrated repositories on Objx builders without raw SQL.

Files:

- `src/modules/reports/infrastructure/persistence/repositories/organization-report-settings.repository.ts`
- `src/modules/permissions/infrastructure/persistence/repositories/permissions.repository.ts`

Implementation notes:

- `organization-report-settings.repository.ts` currently depends on manual `applyToTransaction(trx)`.
  This must be replaced by Objx transaction context binding.
- `permissions.repository.ts` includes:
  - multi-join reads
  - catalog reads
  - membership lookup
  - bulk delete/insert replacement flows
  - effective permission recomputation
- For reads that rely on RLS, still use transactions if the underlying tables are protected by policy.

Acceptance:

- no import of `DatabaseRlsContextService`
- no import of `KNEX_CONNECTION`
- no import of `knex`

### Phase 7 - Replace Migrations and Seeds

- [x] Choose final migration/seed runner approach:
  - Objx codegen runner directly
  - thin project wrappers around Objx codegen
- [x] Replace all Knex-based migration scripts under `scripts/database`.
- [x] Port every migration file under `src/shared/infrastructure/database/migrations`.
- [x] Port every seed file under `src/shared/infrastructure/database/seeds`.
- [x] Remove legacy tables/metadata assumptions:
  - `knex_migrations`
  - `knex_seeds`

Files:

- `scripts/database/make-migration.mjs`
- `scripts/database/make-seed.mjs`
- `scripts/database/migrate-latest.mjs`
- `scripts/database/migrate-rollback.mjs`
- `scripts/database/migrate-status.mjs`
- `scripts/database/seed-run.mjs`
- `scripts/database/seed-rollback.mjs`
- `scripts/database/seed-status.mjs`
- `scripts/database/shared-config.mjs`
- `scripts/database/shared-seed-runner.mjs`
- `src/shared/infrastructure/database/migrations/*.mjs`
- `src/shared/infrastructure/database/seeds/*.mjs`

Implementation notes:

- Keep script names in `package.json` if possible to reduce external churn.
- Internal implementation can change completely.
- Verify bootstrap seed behavior still matches README and `.env` expectations.

Acceptance:

- `npm run migrate:*` works without Knex
- `npm run seed:*` works without Knex

### Phase 8 - Update Module Generator

- [x] Rewrite `scripts/new-module.mjs` so generated persistence code is Objx-native.
- [x] Remove generated code references to:
  - `KNEX_CONNECTION`
  - `Knex`
  - `knex.fn.now()`
  - Knex query snippets
- [x] Ensure generated module examples follow the new persistence conventions.

Files:

- `scripts/new-module.mjs`

Acceptance:

- a freshly generated module does not introduce Knex/Objection code

### Phase 9 - Documentation Update

- [x] Update `README.md` stack section from Knex/Objection to Objx.
- [x] Update architecture and setup sections in `README.md`.
- [x] Update migration/seed commands documentation in `README.md`.
- [x] Update `QUICK_START.md` from Knex language to Objx language.
- [ ] Add reference to this migration todo if useful.

Files:

- `README.md`
- `QUICK_START.md`

Acceptance:

- docs no longer describe Knex/Objection as the project stack
- docs no longer point to removed scripts or obsolete concepts

### Phase 10 - Final Cleanup and Verification

- [x] Remove any residual imports/usages with:
  - `knex`
  - `objection`
  - `KNEX_CONNECTION`
  - `DatabaseRlsContextService`
  - `SnowflakeModel`
- [x] Run build.
- [x] Run lint.
- [ ] Run tests.
- [ ] Run migrations.
- [ ] Run seeds.
- [ ] Start the application successfully.
- [ ] Smoke test auth flow, organization switching, permissions, and reports.

Suggested verification commands:

```bash
rg -n "knex|objection|KNEX_CONNECTION|DatabaseRlsContextService|SnowflakeModel" src scripts package.json README.md QUICK_START.md
npm run build
npm run lint
npm test
npm run migrate:latest
npm run seed:run
npm run start:dev
```

Acceptance:

- zero runtime references to Knex/Objection remain
- app boots
- DB tooling works
- template docs and scaffolding match the new stack

## Known Risks To Address Early

- PostgreSQL RLS depends on `set_config(...)` and therefore on explicit Objx transactions.
- Reads that previously worked outside a transaction may silently lose policy context if not migrated carefully.
- CamelCase <-> snake_case behavior is currently global in Knex and must be re-established per model/session with Objx.
- Snowflake ID generation must remain consistent after removing `SnowflakeModel`.
- `updated_at` and `created_at` behavior must remain correct on inserts/updates.
- `permissions.repository.ts` has the highest query complexity and should not block the rest of the migration.
- `organization-report-settings.repository.ts` must not regress upsert semantics.
- `scripts/new-module.mjs` can reintroduce old patterns if not updated before merge.

## Open Decisions

- [ ] Decide exact token names for Objx providers.
- [ ] Decide whether all repositories will use builders first, or allow raw SQL by default for complex reads.
- [ ] Decide final directory structure for shared Objx model helpers.
- [ ] Decide whether migration/seed files remain under `src/shared/infrastructure/database/` or move to a new `db/` root.

## Resume Checklist For Future Sessions

Before changing code in a new session:

1. Read this file fully.
2. Check the session log at the end.
3. Run:

```bash
git status --short
rg -n "knex|objection|KNEX_CONNECTION|DatabaseRlsContextService|SnowflakeModel" src scripts package.json README.md QUICK_START.md
```

4. Update the checklist statuses before and after edits.
5. Append a short session log entry with:
   - date
   - what changed
   - what remains
   - blockers or deviations from the plan

## Definition Of Done

The migration is complete only when all items below are true:

- no `knex` dependency
- no `objection` dependency
- no runtime Knex/Objection imports
- Objx session is the only DB runtime
- PostgreSQL context bindings work through Objx execution context
- repository behavior is preserved
- migration and seed scripts work
- new module scaffolding generates Objx code
- README and QUICK_START describe Objx, not Knex/Objection

## Session Log

### 2026-04-07

- Completed a fresh analysis using Objx `0.3.0` documentation.
- Confirmed the important new feature: Objx Postgres session supports `executionContextSettings` and applies `set_config(...)` inside `session.transaction(...)`.
- Confirmed the migration can remove the custom `DatabaseRlsContextService` instead of porting it.
- Confirmed current Knex/Objection touchpoints in runtime, repositories, migrations, seeds, scaffolding, package metadata, and docs.
- No implementation changes have been made yet.
- Next recommended step: start with Phase 1 and Phase 2 together in a single pass so the project gets onto Objx infrastructure early.

### 2026-04-07 - Session 2

- Added Objx dependencies to `package.json`, while keeping `knex` and `objection` temporarily because repositories and tooling still depend on them.
- Added new Objx provider tokens and local type aliases:
  - `src/shared/infrastructure/database/database.tokens.ts`
  - `src/shared/infrastructure/database/database.types.ts`
- Added request-session -> Objx execution-context mapper:
  - `src/shared/infrastructure/database/objx-execution-context.util.ts`
- Updated `src/shared/infrastructure/database/database.module.ts` to create and export:
  - `pg.Pool`
  - Objx execution context manager
  - Objx Postgres session with PostgreSQL context bindings
- Kept the legacy Knex/Objection runtime exported in parallel for now so the branch remains incrementally migratable.
- Updated `SessionStorageInterceptor` to open an Objx execution context for every request.
- Remaining immediate work:
  - migrate repositories from legacy tokens/models to `OBJX_SESSION`

### 2026-04-07 - Session 3

- Installed the new Objx packages and refreshed `package-lock.json`.
- Validated the migration foundation with `npm run build`.
- Migrated the simple persistence path to Objx models + builders without leaving raw SQL behind:
  - `src/modules/auth/infrastructure/persistence/models/password-reset-token.model.ts`
  - `src/modules/users/infrastructure/persistence/models/user.model.ts`
  - `src/modules/organizations/infrastructure/persistence/models/organization.model.ts`
  - `src/modules/organizations/infrastructure/persistence/models/organization-membership.model.ts`
  - `src/modules/organizations/infrastructure/persistence/models/organization-membership-role.model.ts`
  - `src/modules/permissions/infrastructure/persistence/models/role.model.ts`
- Rewrote the following repositories to use `OBJX_SESSION` + Objx query builders:
  - `src/modules/auth/infrastructure/persistence/repositories/password-reset-token.repository.ts`
  - `src/modules/users/infrastructure/persistence/repositories/user.repository.ts`
  - `src/modules/organizations/infrastructure/persistence/repositories/organization.repository.ts`
- The temporary raw SQL used during the first infrastructure pass was removed from these simple repositories.
- Current build status after the refactor: green.
- Remaining immediate work:
  - remove legacy Knex/Objection usage from reports and permissions repositories
  - remove the old database runtime exports and services

### 2026-04-07 - Session 4

- Migrated the remaining runtime repositories to Objx builders without leaving raw SQL behind:
  - `src/modules/reports/infrastructure/persistence/repositories/organization-report-settings.repository.ts`
  - `src/modules/permissions/infrastructure/persistence/repositories/permissions.repository.ts`
- Added the remaining Objx models required by reports and permissions joins.
- Simplified the application runtime so `src/shared/infrastructure/database/database.module.ts` now boots only `pg.Pool + Objx`.
- Removed legacy runtime files and dependencies:
  - `knex`
  - `objection`
  - `ts-case-convert`
  - `src/shared/infrastructure/database/database.constants.ts`
  - `src/shared/infrastructure/database/database-rls-context.service.ts`
  - `src/shared/infrastructure/database/config/database.config.ts`
  - `src/shared/infrastructure/database/models/snowflake.model.ts`
- Ported migrations and seeds to Objx and rewrote the database scripts in `scripts/database/*`.
- Current remaining work after this session:
  - update `scripts/new-module.mjs`
  - align `README.md` and `QUICK_START.md`
  - run final residue checks and lint

### 2026-04-07 - Session 5

- Rewrote `scripts/new-module.mjs` so generated modules now include:
  - Objx `defineModel(...)`
  - `OBJX_SESSION`
  - `generateSnowflakeId()`
  - builder-based pagination/count/update/delete flows
- Updated `README.md` and `QUICK_START.md` to describe the project as `Objx + pg`, and removed residual Knex/Objection references from the docs and scaffolding.
- Ran residue search across `src`, `scripts`, `package.json`, `README.md`, and `QUICK_START.md`; no runtime/docs references to `knex`, `objection`, `KNEX_CONNECTION`, `DatabaseRlsContextService`, `SnowflakeModel`, or `ts-case-convert` remain.
- Fixed repository-adjacent lint issues introduced or exposed during the migration:
  - duplicate type/value imports
  - `async` without `await`
  - unused controller/entity symbols
- Validation completed in this session:
  - `npm run lint`
  - `npm run build`
- Remaining work:
  - run `npm test`
  - run `npm run migrate:latest`
  - run `npm run seed:run`
  - start the application and smoke test auth, organizations, permissions, and reports
- Confirmed the duplicate `session-context` implementation was unused and removed:
  - `src/shared/context/session-context.module.ts`
  - `src/shared/context/session-context.service.ts`
- Re-ran `npm run lint` and `npm run build` after deleting those files; both remain green.

### 2026-04-07 - Session 6

- Fixed a post-migration regression in `src/config/swagger-response-inference.ts`:
  - stopped skipping controller methods that declare `response` in `@ApiDoc`
  - taught object-schema inference to read synthesized `PropertyAssignment` and `ShorthandPropertyAssignment` declarations
  - removed the dead helper left behind by that change
- Updated `src/config/swagger-response-inference.spec.ts` to match the current response shape inferred from `toUserResponseDto(...)`:
  - inline response object schema instead of the old named `UserInferred` ref expectation
  - `delete` remains the nullable response case, not `update`
- Validation completed in this session:
  - `npm test -- --runInBand`
  - `npm run lint`
  - `npm run build`
  - replace Knex-based migrations, seeds, and scaffolding

### 2026-04-07 - Session 4

- Migrated the remaining runtime repositories to Objx:
  - `src/modules/reports/infrastructure/persistence/repositories/organization-report-settings.repository.ts`
  - `src/modules/permissions/infrastructure/persistence/repositories/permissions.repository.ts`
- Added the remaining Objx models needed by these repositories:
  - `src/modules/reports/infrastructure/persistence/models/organization-report-settings.model.ts`
  - `src/modules/permissions/infrastructure/persistence/models/permission-feature.model.ts`
  - `src/modules/permissions/infrastructure/persistence/models/permission-action.model.ts`
  - `src/modules/permissions/infrastructure/persistence/models/permission.model.ts`
  - `src/modules/permissions/infrastructure/persistence/models/role-permission.model.ts`
  - `src/modules/permissions/infrastructure/persistence/models/organization-user-permission.model.ts`
- Removed the legacy runtime database layer from `src/shared/infrastructure/database/`:
  - deleted `database.constants.ts`
  - deleted `database-rls-context.service.ts`
  - deleted `config/database.config.ts`
  - deleted `models/snowflake.model.ts`
- Simplified `database.module.ts` so the application runtime now boots only `pg.Pool + Objx`.
- Verified with search that runtime `src/` no longer references:
  - `knex`
  - `objection`
  - `KNEX_CONNECTION`
  - `DatabaseRlsContextService`
  - `SnowflakeModel`
- Current build status after runtime cleanup: green.
- Remaining immediate work:
  - migrate Knex-based migrations, seeds, and `scripts/new-module.mjs`
  - remove `knex`, `objection`, and `ts-case-convert` from `package.json`
  - update `README.md` and `QUICK_START.md`
