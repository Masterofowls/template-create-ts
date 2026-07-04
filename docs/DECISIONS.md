# Architecture Decisions

## ADR-001: Bun as Primary Runtime

**Status:** Accepted

Use Bun for package management, script execution, and API runtime. Node.js 20+ supported for CLI execution.

## ADR-002: Hono as Default API Framework

**Status:** Accepted

Hono is the default due to lightweight footprint and Web Standards API. Fastify available via `--framework fastify`.

## ADR-003: SQLite via libsql for Template

**Status:** Accepted

SQLite requires zero external services for local development. Production can swap `DATABASE_URL` to Turso or Postgres with schema adjustments.

## ADR-004: Biome over ESLint+Prettier

**Status:** Accepted

Single tool for linting and formatting reduces config overhead.

## ADR-005: Security-First Dependencies

**Status:** Accepted

Template includes runtime sanitization libraries and dev-time audit tools as first-class scripts.
